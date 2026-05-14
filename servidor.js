require('colors');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
        process.env.MONGO_URI ||
        'mongodb+srv://silkpets:xGk71IwTltD888cs@silkpets.n8jqo2q.mongodb.net/silkpets?retryWrites=true&w=majority&appName=Silkpets';
const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';

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

const User = mongoose.model('usuarios', userSchema);
const Pet = mongoose.model('pets', petSchema);

function normalizeUser(user) {
    return {
        id: String(user._id),
        nome: user.db_name,
        email: user.db_email,
        telefone: user.db_phone || '',
    };
}

function normalizePet(pet) {
    return {
        id: String(pet._id),
        ownerId: pet.db_owner,
        ownerName: pet.db_ownerName,
        nome: pet.db_name,
        idade: pet.db_idade,
        exames: pet.db_exames,
        veterinario: pet.db_veterinario,
        vacinas: pet.db_vacinas,
        descricao: pet.db_descricao,
        imagem: pet.db_imagem || DEFAULT_PET_IMAGE,
    };
}

app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
});

app.post('/api/users/register', async (request, response) => {
    try {
        
        console.log("teste 1 ");
        console.log(request.body);
        const { nome, email, telefone, password } = request.body;
        console.log("teste 2");

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
        const user = await User.create({
            name: String(nome).trim(),
            email: String(email).toLowerCase().trim(),
            phone: telefone ? String(telefone).trim() : '',
            passwordHash,
        });

        var data = {db_nome: nome, db_email: email, db_phone: telefone, db_password: password}

        usuarios.insertOne(data, function(err, result){
            if (err){
                console.log("EXPLOSAO INFINITA".red)
                console.log(err)
            } else {
                message: 'Usuario cadastrado com sucesso.'
            }
        })

        console.log(data)
        console.log("RESTAURAR REALIDADE".rainbow)
    } catch (error) {
        console.log("EXPLODIR COMPUTADOR".rainbow)
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

        var data = { db_email: email, db_password: password };

        const items = await usuarios.find(data).toArray();

        if (items.length === 0) {
            return response.status(401).json({ message: 'Credenciais invalidas.' });
        }

        let usuario = items[0];
        //console.log(usuario)
        // Busca o mesmo usuário pelo Mongoose para ter o _id compatível com o resto da aplicação
        const owner = await usuarios.findOne({ db_email: email });
        //console.log(owner)
        if (!owner) {
            return response.status(404).json({ message: 'Usuario nao encontrado no sistema.' });
        }

        console.log("logado:", owner);

        request.session.ownerId = owner._id;
        request.session.ownerName = owner.db_nome;
        console.log("request: " + request.session.ownerId)
        console.log("   ._id: " + owner._id)
        response.json({
            message: 'Login realizado com sucesso.',
            user: {
                ...normalizeUser(owner),
                ownerId: owner._id, // <-- isso alimenta o /api/pets
            },
        })
        

    } catch (_error) {
        console.error(_error);
        return response.status(500).json({ message: 'Nao foi possivel realizar o login.' });
    }
});

app.get('/api/pets', async (request, response) => {
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAA".rainbow)
    try {

        const filters = {};
        console.log(request.session.ownerId)
        if (request.session.ownerId) {
            filters.db_owner = request.session.ownerId;
        }


        const pet = await pets.find(filters).toArray()//.populate('posts', 'db_owner')//.sort({ createdAt: -1 });
        console.log(pet)
        console.log(pet.map(p => normalizePet(p)))
        return response.json({ pets: pet.map(p => normalizePet(p)) });
    } catch (_error) {
        console.log(_error)
        return response.status(500).json({ message: 'Nao foi possivel listar os pets.' });
    }
});

app.post('/api/pets', async (request, response) => {
    try {
        const { ownerId, nome, idade, exames, veterinario, vacinas, descricao, imagem } = request.body;
        const owner = await usuarios.findOne(request.session.ownerId);
        console.log("ownerId recebido:", ownerId);
        console.log("owner encontrado:", owner);
        //console.log("collection do User:", usuarios.collection.name)
        console.log("body recebido:", request.body);

        if (!ownerId || !nome || !idade) {
            console.log("tutores")
            return response.status(400).json({ message: 'Tutor, nome e idade do pet sao obrigatorios.' });
        }

        console.log("/api/pets: "+ request.session.ownerId)
        if (!ownerId) {
            console.log("usario nao encontrado")
            return response.status(404).json({ message: 'Usuario responsavel nao encontrado.' });
        }

        var data = { db_owner: ownerId, db_ownerName: request.session.ownerName, db_name: nome, db_idade: idade, db_exames: exames, 
            db_veterinario: veterinario, db_vacinas: vacinas, db_descricao: descricao, db_imagem: imagem}
        pets.insertOne(data, function(err, result){
            if (err){
                console.log("EXPLOSAO INFINITA".red)
                console.log(err)
            } else {
                message: 'Pet cadastrado com sucesso.'
            }
        })
        const savedPet = await pets.findById(pet._id).populate('owner', 'name');

        return response.status(201).json({
            message: 'Pet cadastrado com sucesso.',
            pet: {...normalizePet(data)},
            ownerId: ownerId,
            user: {
                ...normalizeUser(usuario),
                ownerId: owner._id, // <-- isso alimenta o /api/pets
            },
        });
    } catch (_error) {
        console.log(_error)
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