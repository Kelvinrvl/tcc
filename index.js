const express = require('express');
const cors = require('cors');
const Sequelize = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize('faculhub', 'root', 'admin', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306
});

// Configuração do servidor
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Modelos
const Empresa = sequelize.define('empresa', {
    id_empresa: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.TEXT
    },
    logo: {
        type: Sequelize.TEXT
    }
}, { freezeTableName: true, timestamps: false });

const Curso = sequelize.define('curso', {
    id_curso: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    foto: {
        type: Sequelize.TEXT
    },
    nome_curso: {
        type: Sequelize.TEXT
    },
    instituicao: {
        type: Sequelize.TEXT
    },
    empresa_id: {
        type: Sequelize.INTEGER
    }
}, { freezeTableName: true, timestamps: false });

const Usuario = sequelize.define('usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.TEXT
    },
    email: {
        type: Sequelize.TEXT
    },
    nickname: {
        type: Sequelize.TEXT
    },
    senha: {
        type: Sequelize.INTEGER
    },
    foto: {
        type: Sequelize.TEXT
    },
    createdAt: {
        type: Sequelize.TEXT
    },
    updatedAt: {
        type: Sequelize.TEXT
    }
}, { freezeTableName: true, timestamps: false });

const Comentario = sequelize.define('comentario', {
    id_comentario: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    id_curso: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    mensagem: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, { freezeTableName: true, timestamps: false });

// Relacionamentos
Comentario.belongsTo(Usuario, { foreignKey: 'id', onDelete: 'CASCADE' });
Comentario.belongsTo(Curso, { foreignKey: 'id_curso', onDelete: 'CASCADE' });

// Rotas
app.post('/api/comentarios', async (req, res) => {
    const { id, id_curso, mensagem } = req.body;

    try {
        const usuario = await Usuario.findByPk(id);
        const curso = await Curso.findByPk(id_curso);

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        if (!curso) {
            return res.status(404).json({ success: false, message: 'Curso não encontrado' });
        }

        const novoComentario = await Comentario.create({ id, id_curso, mensagem });

        res.status(201).json({
            success: true,
            message: 'Comentário salvo com sucesso!',
            comentario: novoComentario
        });
    } catch (error) {
        console.error('Erro ao salvar comentário:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar comentário' });
    }
});

app.put('/api/comentarios/:id_comentario', async (req, res) => {
    const { id_comentario } = req.params;
    const { mensagem } = req.body;

    try {
        const comentario = await Comentario.findByPk(id_comentario);

        if (!comentario) {
            return res.status(404).json({ success: false, message: "Comentário não encontrado" });
        }

        await comentario.update({ mensagem });
        res.json({ success: true, message: "Comentário atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar comentário:", error);
        res.status(500).json({ success: false, message: "Erro ao atualizar comentário." });
    }
});
app.delete('/api/comentarios/:id_comentario', async (req, res) => {
    const { id_comentario } = req.params;

    try {
        const comentario = await Comentario.findByPk(id_comentario);
        if (!comentario) {
            return res.status(404).json({ success: false, message: "Comentário não encontrado" });
        }

        await comentario.destroy();
        res.json({ success: true, message: "Comentário excluído com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir comentário:", error);
        res.status(500).json({ success: false, message: "Erro ao excluir comentário." });
    }
});


app.get('/api/comentarios', async (req, res) => {
    try {
        const comentarios = await Comentario.findAll({
            include: [
                { model: Usuario, attributes: ['nickname'] },
                { model: Curso, attributes: ['nome_curso'] }
            ]
        });

        const resposta = comentarios.map(c => ({
            id_comentario: c.id_comentario,
            id: c.id,
            id_curso: c.id_curso,
            mensagem: c.mensagem,
            usuario: c.usuario?.nickname || 'Usuário desconhecido',
            curso: c.curso?.nome_curso || 'Curso desconhecido',
        }));

        res.json(resposta);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ error: 'Erro ao buscar comentários.' });
    }
});
app.get('/api/comentarios/contagem', async (req, res) => {
    
   
    try {
            
            c
    
          
    
       
    const count = await Comentario.count();
            res.
            res
    json({ total: count });
        } 
       
    catch (error) {
            console.error('Erro ao contar comentários:', error);
            res.
           
    status(500).json({ error: 'Erro ao contar comentários.' });
        }
    });
app.get('/api/empresas', async (req, res) => {
    try {
        const listaEmpresas = await Empresa.findAll();
        res.json(listaEmpresas);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar empresas." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { email, senha } });

        if (usuario) {
            res.json({ success: true, message: 'Usuário logado com sucesso!' });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha incorreto' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao verificar usuário' });
    }
});

app.get('/api/usuarios/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const usuario = await Usuario.findOne({ where: { email } });
        if (usuario) {
            res.json(usuario);
        } else {
            res.status(404).json({ error: "Usuário não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuário." });
    }
});

app.get('/api/cursos', async (req, res) => {
    try {
        const cursos = await Curso.findAll();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar cursos." });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const listaUsuarios = await Usuario.findAll();
        res.json(listaUsuarios);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
});

// Inicializar o servidor
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');

        await sequelize.sync();

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
    }
})();
