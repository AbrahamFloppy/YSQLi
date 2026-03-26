const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuración de la conexión a PostgreSQL
require('dotenv').config();

// Luego modifica la configuración de la base de datos:
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Probar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.stack);
    } else {
        console.log('✅ Conectado a PostgreSQL correctamente');
        release();
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir el archivo de registro
app.get('/registrar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'registrar.html'));
});

// Ruta para registrar nuevos usuarios
app.post('/register', async (req, res) => {
    console.log('📥 Body recibido:', req.body);
    
    const { nombre, gmail, contraseña } = req.body;

    console.log('📝 Intentando registrar usuario:', { nombre, gmail });

    // Validaciones
    if (!nombre || !gmail || !contraseña) {
        console.log('❌ Campos faltantes');
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }

    if (contraseña.length < 4) {
        console.log('❌ Contraseña muy corta');
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 4 caracteres'
        });
    }

    try {
        // Verificar si el usuario ya existe (VULNERABLE a SQL Injection)
        const checkQuery = `SELECT id FROM public.usuario WHERE nombre = '${nombre}' OR gmail = '${gmail}'`;
        console.log("🔍 Verificando existencia:", checkQuery);
        
        const existingUser = await pool.query(checkQuery);
        
        if (existingUser.rows.length > 0) {
            console.log('❌ Usuario ya existe');
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o email ya está registrado'
            });
        }

        // Insertar nuevo usuario (VULNERABLE a SQL Injection)
        const insertQuery = `INSERT INTO public.usuario (nombre, gmail, contrasenha) VALUES ('${nombre}', '${gmail}', '${contraseña}') RETURNING id, nombre, gmail`;
        
        console.log("📝 Insertando usuario:", insertQuery);
        
        const result = await pool.query(insertQuery);

        console.log('✅ Usuario registrado exitosamente:', result.rows[0]);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            usuario: {
                id: result.rows[0].id,
                nombre: result.rows[0].nombre,
                gmail: result.rows[0].gmail
            }
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message,
            detail: error.detail || 'No hay detalles adicionales'
        });
    }
});

// Ruta para login vulnerable
app.post('/login', async (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({
            success: false,
            message: 'Nombre y contraseña son requeridos'
        });
    }

    try {
        const query = `SELECT id, nombre, contrasenha FROM public.usuario WHERE nombre = '${nombre}' AND contrasenha = '${contraseña}'`;
        
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
            console.log(`✅ Login exitoso: ${nombre}`);
        } else {
            res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });
            console.log(`❌ Fallo de login: ${nombre}`);
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

// Ruta para ver todos los usuarios
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

// Ruta para consultas personalizadas (MUY PELIGROSA)
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
            rowCount: result.rowCount,
            fields: result.fields ? result.fields.map(f => f.name) : []
        });
    } catch (error) {
        console.error('Error en consulta personalizada:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            detail: error.detail || 'No hay detalles adicionales'
        });
    }
});

// Ruta para información de la tabla
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
    console.log("📚 Para prácticas de seguridad ofensiva");
    console.log("\n📝 Endpoints disponibles:");
    console.log("   POST /register - Registrar nuevos usuarios");
    console.log("   POST /login - Login vulnerable a SQL injection");
    console.log("   GET /usuarios - Ver todos los usuarios");
    console.log("   POST /query - Ejecutar consultas SQL personalizadas");
    console.log("   GET /tabla-info - Ver estructura de la tabla");
    console.log("\n💡 Para probar:");
    console.log("   1. Abre http://localhost:5000/registrar.html");
    console.log("   2. Registra un nuevo usuario");
    console.log("   3. Revisa la consola para ver los logs");
});