require('colors');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { request } = require('http');
var mongodb = require("mongodb");
var bodyParser = require("body-parser")

dotenv.config();
const MongoClient = mongodb.MongoClient;
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
        process.env.MONGO_URI ||
        'mongodb+srv://silkpets:xGk71IwTltD888cs@silkpets.n8jqo2q.mongodb.net/silkpets?retryWrites=true&w=majority&appName=Silkpets';
const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';
const client = new MongoClient(MONGO_URI);

app.use(express.static('./public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.set('views', './views');
var session = require('express-session');
app.use(session({
    secret: 'segredo-super-seguro',
    resave: false,
    saveUninitialized: true
}));

var dbo = client.db("Silkpets");
var usuarios = dbo.collection("usuarios");
var pets = dbo.collection("pets");
// Set-ExecutionPolicy -Scope CurrentUser 
// Unrestricted
// npm init (se nao tiver o package)
// npm install express
// npm install colors
// npm install mongodb
// npm update mongodb
// npm update express
// npm install express-session

// cria um banco e as 'tabela'
console.log('Servidor iniciando ...'.rainbow);
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

const petSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        age: {
            type: String,
            required: true,
            trim: true,
        },
        examsStatus: {
            type: String,
            trim: true,
            default: 'Nao informado',
        },
        veterinarian: {
            type: String,
            trim: true,
            default: 'Nao informado',
        },
        vaccinesStatus: {
            type: String,
            trim: true,
            default: 'Nao informado',
        },
        description: {
            type: String,
            trim: true,
            default: 'Sem descricao cadastrada.',
        },
        imageUrl: {
            type: String,
            trim: true,
            default: DEFAULT_PET_IMAGE,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);
const Pet = mongoose.model('Pet', petSchema);

function normalizeUser(user) {
    return {
        id: String(user._id),
        nome: user.name,
        email: user.email,
        telefone: user.phone || '',
    };
}

function normalizePet(pet) {
    return {
        id: String(pet._id),
        ownerId: typeof pet.owner === 'object' && pet.owner ? String(pet.owner._id || pet.owner) : String(pet.owner),
        ownerName: typeof pet.owner === 'object' && pet.owner ? pet.owner.name || '' : '',
        nome: pet.name,
        idade: pet.age,
        exames: pet.examsStatus,
        veterinario: pet.veterinarian,
        vacinas: pet.vaccinesStatus,
        descricao: pet.description,
        imagem: pet.imageUrl || DEFAULT_PET_IMAGE,
    };
}

app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
});

app.get("/api/user/register", function(request, response) {
    console.log("MORTE E SOFRIMENTO".red)
    let nome = request.query.nome;
    let email = request.query.email;
    let telefone = request.query.telefone;
    let password = request.query.password;

    
    console.log(nome, email, telefone, senha)
})

app.post("/api/users/register", async (request, response) => {
    try {
        
        const { nome, email, telefone, password } = request.body;

        if (!nome || !email || !password) {
            return response.status(400).json({ message: 'Nome, email e senha sao obrigatorios.' });
        }
        if (String(password).length < 6) {
            return response.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }
        const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (existingUser) {
            return response.status(409).json({ message: 'Ja existe um usuario com este email.' });
        }
        const passwordHash = await bcrypt.hash(String(password), 10);

        var data = {db_nome: nome, db_email: email, db_phone: telefone, db_password: password}

        usuarios.insertOne(data, function(err, result){
            if (err){
                console.log("EXPLOSAO INFINITA".red)
                console.log(err)
            } else {
                message: 'Usuario cadastrado com sucesso.'
            }
        })
        // const user = await User.create({
        //     name: String(nome).trim(),
        //     email: String(email).toLowerCase().trim(),
        //     phone: telefone ? String(telefone).trim() : '',
        //     passwordHash: String(passwordHash).trim(),
        // });

        console.log(data)
        console.log("RESTAURAR REALIDADE".rainbow)
        // return response.status(201).json({
        //     ,
        // });
    } catch (error) {
        console.log("APAGAR REALIDADE".red)
        if (error && error.code === 11000) {
            return response.status(409).json({ message: 'Ja existe um usuario com este email.' });
        }

        return response.status(500).json({ message: 'Nao foi possivel cadastrar o usuario.' });
    }
});

app.get("/api/user/login", function(request, response) {
    console.log("MORTE E SOFRIMENTO".red)
    let email = request.query.email;
    let password = request.query.password;

    
    console.log(email, password)
})

app.post('/api/users/login', async (request, response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password) {
            return response.status(400).json({ message: 'Email e senha sao obrigatorios.' });
        }

        const user = await User.findOne({ email: String(email).toLowerCase().trim() });

        if (!user) {
            return response.status(401).json({ message: 'Credenciais invalidas.' });
        }

        const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);

        if (!passwordMatches) {
            return response.status(401).json({ message: 'Credenciais invalidas.' });
        }

        return response.json({
            message: 'Login realizado com sucesso.',
            user: normalizeUser(user),
        });
    } catch (_error) {
        return response.status(500).json({ message: 'Nao foi possivel realizar o login.' });
    }
});

app.get('/api/pets', async (request, response) => {
    try {
        const filters = {};

        if (request.query.ownerId) {
            filters.owner = request.query.ownerId;
        }

        const pets = await Pet.find(filters).populate('owner', 'name').sort({ createdAt: -1 });

        return response.json({ pets: pets.map(normalizePet) });
    } catch (_error) {
        return response.status(500).json({ message: 'Nao foi possivel listar os pets.' });
    }
});

app.post('/api/pets', async (request, response) => {
    try {
        const { ownerId, nome, idade, exames, veterinario, vacinas, descricao, imagem } = request.body;

        if (!ownerId || !nome || !idade) {
            return response.status(400).json({ message: 'Tutor, nome e idade do pet sao obrigatorios.' });
        }

        const owner = await User.findById(ownerId);

        if (!owner) {
            return response.status(404).json({ message: 'Usuario responsavel nao encontrado.' });
        }

        const pet = await Pet.create({
            owner: owner._id,
            name: String(nome).trim(),
            age: String(idade).trim(),
            examsStatus: exames ? String(exames).trim() : 'Nao informado',
            veterinarian: veterinario ? String(veterinario).trim() : 'Nao informado',
            vaccinesStatus: vacinas ? String(vacinas).trim() : 'Nao informado',
            description: descricao ? String(descricao).trim() : 'Sem descricao cadastrada.',
            imageUrl: imagem ? String(imagem).trim() : DEFAULT_PET_IMAGE,
        });

        const savedPet = await Pet.findById(pet._id).populate('owner', 'name');

        return response.status(201).json({
            message: 'Pet cadastrado com sucesso.',
            pet: normalizePet(savedPet),
        });
    } catch (_error) {
        return response.status(500).json({ message: 'Nao foi possivel cadastrar o pet.' });
    }
});

app.use(express.static(path.resolve(__dirname)));

app.get('/', (_request, response) => {
    response.redirect('/Paginas/Main/index.html');
});

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB conectado com sucesso.'.green);

        app.listen(PORT, () => {
            console.log(`SilkPets rodando em http://localhost:${PORT}`.rainbow);
        });
    } catch (error) {
        console.error('Falha ao iniciar o servidor:', error.message);
        process.exit(1);
    }
}

startServer();