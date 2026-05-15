require('colors');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
var mongodb = require("mongodb");
var bodyParser = require("body-parser")

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
        process.env.MONGO_URI ||
        'mongodb+srv://silkpets:xGk71IwTltD888cs@silkpets.n8jqo2q.mongodb.net/silkpets?retryWrites=true&w=majority&appName=Silkpets';
const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';

app.use(express.static('./public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.set('views', './views');
var session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo-super-seguro',
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

console.log('Servidor iniciando ...'.rainbow);

function normalizeUser(user) {
    return {
        id: String(user._id),
        nome: user.db_nome || user.db_name || user.name || '',
        email: user.db_email || user.email || '',
        telefone: user.db_phone || user.phone || '',
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

function resolveOwnerId(value) {
    return String(value || '').trim();
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

    
    console.log(nome, email, telefone, password)
})

app.post("/api/users/register", async (request, response) => {
    try {
        const { nome, email, telefone, password } = request.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        if (!nome || !email || !password) {
            return response.status(400).json({ message: 'Nome, email e senha sao obrigatorios.' });
        }

        if (String(password).length < 6) {
            return response.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }
        const existingUser = await usuarios.findOne({ db_email: normalizedEmail });
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

        const data = {
            db_nome: String(nome).trim(),
            db_email: normalizedEmail,
            db_phone: String(telefone || '').trim(),
            db_password: passwordHash,
        };

        const result = await usuarios.insertOne(data);
        const savedUser = {
            _id: result.insertedId,
            ...data,
        };

        request.session.ownerId = String(savedUser._id);
        request.session.ownerName = savedUser.db_nome;

        return response.status(201).json({
            message: 'Usuario cadastrado com sucesso.',
            user: normalizeUser(savedUser),
        });
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
        const normalizedEmail = String(email || '').toLowerCase().trim();
        
        if (!email || !password) {
            return response.status(400).json({ message: 'Email e senha sao obrigatorios.' });
        }

        const owner = await usuarios.findOne({ db_email: normalizedEmail });
        if (!owner) {
            return response.status(401).json({ message: 'Credenciais invalidas.' });
        }

        const storedPassword = owner.db_password || owner.passwordHash || '';
        const passwordMatches = storedPassword.startsWith('$2')
            ? await bcrypt.compare(String(password), storedPassword)
            : storedPassword === String(password);

        if (!passwordMatches) {
            return response.status(401).json({ message: 'Credenciais invalidas.' });
        }

        console.log("logado:", owner);

        request.session.ownerId = String(owner._id);
        request.session.ownerName = owner.db_nome;
        console.log("request: " + request.session.ownerId)
        console.log("   ._id: " + owner._id)
        return response.json({
            message: 'Login realizado com sucesso.',
            user: normalizeUser(owner),
        });
        

    } catch (_error) {
        console.error(_error);
        return response.status(500).json({ message: 'Nao foi possivel realizar o login.' });
    }
});

app.post('/api/users/logout', (request, response) => {
    if (!request.session) {
        return response.json({ message: 'Logout realizado com sucesso.' });
    }

    return request.session.destroy((error) => {
        if (error) {
            console.error(error);
            return response.status(500).json({ message: 'Nao foi possivel encerrar a sessao.' });
        }

        response.clearCookie('connect.sid');
        return response.json({ message: 'Logout realizado com sucesso.' });
    });
});

// essa parte nunca acontece arruma ela
app.get('/api/pets', async (request, response) => {
    console.log("SESSION:", request.session);
    console.log("QUERY:", request.query);
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAA".rainbow)
    try {
        const filters = { db_owner: ownerId };  // também string

        if (!ownerId) {
            return response.json({ pets: [] });
        }

        response.set('Cache-Control', 'no-store');

        const filters = { db_owner: ownerId };
        console.log(ownerId)


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
        const { nome, idade, exames, veterinario, vacinas, descricao, imagem } = request.body;
        const sessionOwnerId = resolveOwnerId(request.body.ownerId || request.session.ownerId);

        if (!sessionOwnerId) {
            return response.status(401).json({ message: 'Voce precisa estar logado para cadastrar um pet.' });
        }

        if (!mongodb.ObjectId.isValid(sessionOwnerId)) {
            return response.status(400).json({ message: 'Usuario responsavel invalido.' });
        }

        const owner = await usuarios.findOne({ _id: new mongodb.ObjectId(sessionOwnerId) });
        console.log("ownerId recebido:", request.body.ownerId);
        console.log("owner encontrado:", owner);
        //console.log("collection do User:", usuarios.collection.name)
        console.log("body recebido:", request.body);

        // ✅ Validar inputs primeiro
        if (!nome || !idade) {
            return response.status(400).json({ message: 'Nome e idade do pet sao obrigatorios.' });
        }

        // Depois buscar o owner
        const owner = await usuarios.findOne({ _id: new mongodb.ObjectId(sessionOwnerId) });
        if (!owner) {
            return response.status(404).json({ message: 'Usuario responsavel nao encontrado.' });
        }

        request.session.ownerId = sessionOwnerId;
        request.session.ownerName = request.session.ownerName || owner.db_nome;

        const data = {
            db_owner: sessionOwnerId,
            db_ownerName: request.session.ownerName || owner.db_nome,
            db_name: String(nome).trim(),
            db_idade: String(idade).trim(),
            db_exames: String(exames || '').trim() || 'Nao informado',
            db_veterinario: String(veterinario || '').trim() || 'Nao informado',
            db_vacinas: String(vacinas || '').trim() || 'Nao informado',
            db_descricao: String(descricao || '').trim() || 'Sem descricao cadastrada.',
            db_imagem: String(imagem || '').trim() || DEFAULT_PET_IMAGE,
        };
        const result = await pets.insertOne(data);
        const savedPet = {
            _id: result.insertedId,
            ...data,
        };

        return response.status(201).json({
            message: 'Pet cadastrado com sucesso.',
            pet: normalizePet(savedPet),
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
        await client.connect();
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB conectado com sucesso.'.green);

        app.listen(PORT, () => {
            console.log(`SilkPets rodando em http://localhost:${PORT}`.rainbow);
        });
    } catch (error) {
        console.error('Falha ao conectar ao MongoDB:', error.message);
        console.error('Verifique se o IP desta maquina esta liberado no MongoDB Atlas (Network Access).'.yellow);
        process.exit(1);
    }
}

startServer();