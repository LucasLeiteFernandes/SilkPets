const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/silkpets';
const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://silkpets:xGk71IwTltD888cs@silkpets.n8jqo2q.mongodb.net/?appName=Silkpets";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
	version: ServerApiVersion.v1,
	strict: true,
	deprecationErrors: true,
  }
});

async function run() {
  try {
	// Connect the client to the server	(optional starting in v4.7)
	await client.connect();
	// Send a ping to confirm a successful connection
	await client.db("admin").command({ ping: 1 });
	console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
	// Ensures that the client will close when you finish/error
	await client.close();
  }
}
run().catch(console.dir);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("Servidor rodando ...".rainbow);
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

app.post('/api/users/register', async (request, response) => {
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
		const user = await User.create({
			name: String(nome).trim(),
			email: String(email).toLowerCase().trim(),
			phone: telefone ? String(telefone).trim() : '',
			passwordHash,
		});

		return response.status(201).json({
			message: 'Usuario cadastrado com sucesso.',
			user: normalizeUser(user),
		});
	} catch (error) {
		if (error && error.code === 11000) {
			return response.status(409).json({ message: 'Ja existe um usuario com este email.' });
		}

		return response.status(500).json({ message: 'Nao foi possivel cadastrar o usuario.' });
	}
});

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
		app.listen(PORT, () => {
			console.log(`SilkPets rodando em http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Falha ao iniciar o servidor:', error.message);
		process.exit(1);
	}
}

startServer();