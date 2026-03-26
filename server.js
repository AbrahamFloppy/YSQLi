require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS corregido
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Servir carpeta /images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Conexión a PostgreSQL en Railway
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false }
});

// Probar conexión
pool.connect()
    .then(() => console.log("✅ Conectado a PostgreSQL en Railway"))
    .catch(err => console.error("❌ Error conectando:", err.stack));

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/registrar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'registrar.html'));
});

// Registrar usuario
app.post('/register', async (req, res) => {
    const { nombre, gmail, contraseña } = req.body;

    if (!nombre || !gmail || !contraseña) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }

    if (contraseña.length < 4) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 4 caracteres'
        });
    }

    try {
        const checkQuery = `SELECT id FROM public.usuario WHERE nombre = '${nombre}' OR gmail = '${gmail}'`;
        const existingUser = await pool.query(checkQuery);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o email ya está registrado'
            });
        }

        const insertQuery = `INSERT INTO public.usuario (nombre, gmail, contrasenha) 
                             VALUES ('${nombre}', '${gmail}', '${contraseña}') 
                             RETURNING id, nombre, gmail`;

        const result = await pool.query(insertQuery);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({
            success: false,
            message: 'Nombre y contraseña son requeridos'
        });
    }

    try {
        const query = `SELECT id, nombre, contrasenha 
                       FROM public.usuario 
                       WHERE nombre = '${nombre}' AND contrasenha = '${contraseña}'`;

        const result = await pool.query(query);

        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            res.json({
                success: true,
                message: 'Login exitoso',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
