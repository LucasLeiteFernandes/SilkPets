require('colors');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
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

    
    console.log(nome, email, telefone, password)
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

        //const filters = { db_owner: ownerId };
        console.log(ownerId)


        const pets = await Pet.find(filters).populate('owner', 'name').sort({ createdAt: -1 });

        return response.json({ pets: pets.map(normalizePet) });
    } catch (_error) {
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
        //const owner = await usuarios.findOne({ _id: new mongodb.ObjectId(sessionOwnerId) });
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