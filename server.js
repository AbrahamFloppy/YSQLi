require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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

// Registrar usuario (vulnerable)
app.post('/register', async (req, res) => {
    console.log('📥 Body recibido:', req.body);
    
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
        console.log("🔍 Verificando existencia:", checkQuery);
        
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
        
        console.log("📝 Insertando usuario:", insertQuery);
        
        const result = await pool.query(insertQuery);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            usuario: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// Login vulnerable
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
        
        console.log("🚨 Consulta vulnerable ejecutada:");
        console.log(query);
        
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
        console.error('Error en la consulta:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

// Ver usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const query = 'SELECT id, nombre, gmail FROM public.usuario ORDER BY id';
        const result = await pool.query(query);
        
        res.json({
            success: true,
            usuarios: result.rows
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener usuarios',
            error: error.message 
        });
    }
});

// Ejecutar consultas personalizadas (vulnerable)
app.post('/query', async (req, res) => {
    const { sql } = req.body;
    
    if (!sql) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere una consulta SQL'
        });
    }
    
    try {
        console.log("🚨 Consulta personalizada ejecutada:");
        console.log(sql);
        const result = await pool.query(sql);
        res.json({
            success: true,
            rows: result.rows,
            rowCount: result.rowCount
        });
    } catch (error) {
        console.error('Error en consulta personalizada:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Info de tabla
app.get('/tabla-info', async (req, res) => {
    try {
        const query = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'usuario'
            ORDER BY ordinal_position
        `;
        const result = await pool.query(query);
        res.json({
            success: true,
            columnas: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log("Autor: Yazi");
    console.log(`🚀 Servidor VULNERABLE corriendo en http://localhost:${PORT}`);
    console.log("⚠️  Este servidor es INTENCIONALMENTE vulnerable a SQL Injection");
});
