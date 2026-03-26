require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Conexión a PostgreSQL
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


// ===============================
//   REGISTRO (CORREGIDO)
// ===============================
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
        // Verificar si ya existe
        const checkQuery = `
            SELECT id FROM public.usuario 
            WHERE nombre = $1 OR gmail = $2
        `;
        const existingUser = await pool.query(checkQuery, [nombre, gmail]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o email ya está registrado'
            });
        }

        // Insertar usuario
        const insertQuery = `
            INSERT INTO public.usuario (nombre, gmail, contrasenha)
            VALUES ($1, $2, $3)
            RETURNING id, nombre, gmail
        `;
        const result = await pool.query(insertQuery, [nombre, gmail, contraseña]);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Error en /register:", error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});


// ===============================
//   LOGIN (CORREGIDO)
// ===============================
app.post('/login', async (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({
            success: false,
            message: 'Nombre y contraseña son requeridos'
        });
    }

    try {
        const query = `
            SELECT id, nombre, contrasenha 
            FROM public.usuario 
            WHERE nombre = $1 AND contrasenha = $2
        `;

        const result = await pool.query(query, [nombre, contraseña]);

        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            return res.json({
                success: true,
                message: 'Login exitoso',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
        }

    } catch (error) {
        console.error("❌ Error en /login:", error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

