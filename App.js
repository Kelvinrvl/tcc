import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [usuarios, setUsuarios] = useState([]);
    const [empresa, setEmpresa] = useState(null);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [cursos, setCursos] = useState([]);
    const [comentario, setComentario] = useState('');
    const [comentariosVisiveis, setComentariosVisiveis] = useState({});
    const [comentariosCurso, setComentariosCurso] = useState({});
    const [comentarioEmEdicao, setComentarioEmEdicao] = useState(null); // Estado para rastrear o comentário em edição
    const [novoTexto, setNovoTexto] = useState(''); // Estado para o texto do comentário
    const [comentarioEmExclusao, setComentarioEmExclusao] = useState(null);
    // Carregar dados iniciais
    useEffect(() => {
        axios.get('http://localhost:3001/api/usuarios')
            .then(response => setUsuarios(response.data))
            .catch(error => console.error("Erro ao buscar usuários:", error));

        axios.get('http://localhost:3001/api/empresas')
            .then(response => {
                if (response.data.length > 0) {
                    setEmpresa(response.data[0]);
                }
            })
            .catch(error => console.error("Erro ao buscar empresa:", error));

        axios.get('http://localhost:3001/api/cursos')
            .then(response => setCursos(response.data))
            .catch(error => console.error("Erro ao buscar cursos:", error));

        axios.get('http://localhost:3001/api/comentarios')
            .then(response => {
                const comentariosAgrupados = response.data.reduce((acc, comentario) => {
                    if (!acc[comentario.id_curso]) acc[comentario.id_curso] = [];
                    acc[comentario.id_curso].push(comentario);
                    return acc;
                }, {});
                setComentariosCurso(comentariosAgrupados);
            })
            .catch(error => console.error("Erro ao buscar comentários:", error));
    }, []);

    // Gerenciar modal de login
    const openLoginModal = () => setIsLoginVisible(true);
    const closeLoginModal = () => {
        setIsLoginVisible(false);
        setEmail('');
        setSenha('');
        setError('');
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/login', { email, senha });
            if (response.data.success) {
                alert('USUÁRIO LOGADO COM SUCESSO!');
                const usuario = await axios.get(`http://localhost:3001/api/usuarios/${email}`);
                setUsuarioLogado(usuario.data);
                closeLoginModal();
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Usuário ou senha incorreto');
            } else {
                setError('Erro ao realizar login');
            }
        }
    };

    const handleLogout = () => {
        setUsuarioLogado(null);
        window.location.reload();
    };

    const toggleCommentBox = (cursoId) => {
        setComentariosVisiveis(prev => ({
            ...prev,
            [cursoId]: !prev[cursoId]
        }));
    };

    const handleComentarioChange = (event) => {
        setComentario(event.target.value);
    };

    const handleEnviarComentario = async (idCurso) => {
        if (!usuarioLogado) {
            alert("Você precisa estar logado para comentar.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:3001/api/comentarios', {
                id: usuarioLogado.id,
                id_curso: idCurso,
                mensagem: comentario,
            });

            if (response.data.success) {
                alert('Comentário enviado com sucesso!');
                setComentario('');
                setComentariosCurso(prev => ({
                    ...prev,
                    [idCurso]: [...(prev[idCurso] || []), {
                        id_comentario: response.data.comentario.id_comentario,
                        id: usuarioLogado.id,
                        id_curso: idCurso,
                        mensagem: comentario,
                        usuario: usuarioLogado.nickname,
                    }]
                }));
                toggleCommentBox(idCurso); // Fecha a caixa de comentários
            }
        } catch (error) {
            console.error("Erro ao enviar comentário:", error);
            alert("Erro ao salvar o comentário. Tente novamente mais tarde.");
        }
    };
    const handleEditComentario = (comentario) => {
        setComentarioEmEdicao(comentario);
        setNovoTexto(comentario.mensagem);
    };

    const handleSalvarEdicao = async () => {
        if (!comentarioEmEdicao) return;

        try {
            const response = await axios.put(`http://localhost:3001/api/comentarios/${comentarioEmEdicao.id_comentario}`, {
                mensagem: novoTexto,
            });

            if (response.data.success) {
                alert("Comentário atualizado com sucesso!");
                setComentariosCurso((prev) => ({
                    ...prev,
                    [comentarioEmEdicao.id_curso]: prev[comentarioEmEdicao.id_curso].map((c) =>
                        c.id_comentario === comentarioEmEdicao.id_comentario
                            ? { ...c, mensagem: novoTexto }
                            : c
                    ),
                }));
                setComentarioEmEdicao(null);
                setNovoTexto('');
            }
        } catch (error) {
            console.error("Erro ao atualizar comentário:", error);
            alert("Erro ao salvar o comentário. Tente novamente mais tarde.");
        }
    };
    const handleExcluirComentario = async (comentarioId) => {
        try {
            const response = await axios.delete(`http://localhost:3001/api/comentarios/${comentarioId}`);
            if (response.data.success) {
                alert("Comentário excluído com sucesso!");
                setComentariosCurso((prev) => {
                    const updatedComentarios = { ...prev };
                    for (const cursoId in updatedComentarios) {
                        updatedComentarios[cursoId] = updatedComentarios[cursoId].filter(c => c.id_comentario !== comentarioId);
                    }
                    return updatedComentarios;
                });
                setComentarioEmExclusao(null); // Fechar modal
            }
        } catch (error) {
            console.error("Erro ao excluir comentário:", error);
            alert("Erro ao excluir o comentário. Tente novamente mais tarde.");
        }
    };

    // Componentes
    const Cabeca = () => (
        <div id="cabe">
            <h1>FaculHub - O curso para você</h1>
            <div>
                <img id="img" src="./instagram.webp" alt="instagram" />
                <img id="img" src="./twitter.png" alt="twitter" />
            </div>
        </div>
    );

    const Primeira = ({ foto, nome, inscricoes, onOpenLogin, onLogout, isLoggedIn }) => (
        <>
            {isLoggedIn ? (
                <input
                    type="submit"
                    value="Sair"
                    onClick={onLogout}
                    style={{ backgroundColor: 'red', color: 'white' }}
                />
            ) : (
                <input
                    type="submit"
                    value="Entrar"
                    onClick={onOpenLogin}
                    style={{ backgroundColor: '#22B14C', color: 'white' }}
                />
            )}
            <img src={foto} alt={nome} />
            <h2>{nome}</h2>
            <p>Inscrições: {inscricoes}</p>
        </>
    );

    const Terceira = ({ idCurso, nomeCurso, instituicao, foto, like, onOpenLogin, isLoggedIn, totalComentarios }) => (
        <div className="cursos">
            <div className="nomeInst">
                <p>{nomeCurso}</p>
                <p>{instituicao}</p>
            </div>
            <div className="fotoCurso">
                <img className="cursoImg" src={foto} alt={nomeCurso} />
            </div>
            <div className="svgDiv">
                <img
                    className="svg"
                    src={like}
                    alt="like"
                    onClick={() => {
                        if (!isLoggedIn) onOpenLogin();
                    }}
                />
                <img
                    className="svg"
                    src="chat.svg"
                    alt="comentário"
                    onClick={() => toggleCommentBox(idCurso)}
                    
                />

            </div>
            {comentariosVisiveis[idCurso] && (
                <div className="commentBox">
                    <textarea
                        value={comentario}
                        onChange={handleComentarioChange}
                        placeholder="Escreva seu comentário aqui..."
                        className="textarea"
                    ></textarea>
                    <button
                        onClick={() => handleEnviarComentario(idCurso)}
                        disabled={!comentario.trim()}
                        style={{
                            backgroundColor: comentario.trim() ? '#22B14C' : '#C4C4C4',
                            color: '#000000',
                            float: 'right',
                            marginTop: '10px',
                            cursor: comentario.trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Comentar
                    </button>
                </div>
            )}
            {comentariosCurso[idCurso] && (
                <div className="comentarios">
                {comentariosCurso[idCurso]?.map((comentario) => (
                    <div key={comentario.id_comentario} className="comentario">
                        <strong>{comentario.usuario}:</strong> {comentario.mensagem}
                        {usuarioLogado && usuarioLogado.id === comentario.id && (
                            <>
                                <img
                                    className="svg editar"
                                    src="lapis_editar.svg"
                                    alt="Editar"
                                    onClick={() => handleEditComentario(comentario)}
                                />
                                <img
                                    className="svg deletar"
                                    src="lixeira_deletar.svg"
                                    alt="Excluir"
                                    onClick={() => setComentarioEmExclusao(comentario)}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
            )}
            {comentarioEmEdicao && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Editar Comentário</h2>
                        <textarea
                            value={novoTexto}
                            onChange={(e) => setNovoTexto(e.target.value)}
                            className="textarea"
                        ></textarea>
                        <button onClick={() => setComentarioEmEdicao(null)} style={{ border: '1px solid #22B14C' }}>Cancelar</button>
                        <button onClick={handleSalvarEdicao} style={{ backgroundColor: '#22B14C', color: '#FFF' }}>Atualizar</button>
                    </div>
                </div>
            )}
            
            {comentarioEmExclusao && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Deseja excluir este comentário?</h2>
                        <p>{comentarioEmExclusao.mensagem}</p>
                        <button
                            onClick={() => setComentarioEmExclusao(null)}
                            style={{ border: '1px solid #FF0000' }}
                        >
                            Não
                        </button>
                        <button
                            onClick={() => handleExcluirComentario(comentarioEmExclusao.id_comentario)}
                            style={{ backgroundColor: '#FF0000', color: '#FFF' }}
                        >
                            Sim
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="App">
            <Cabeca />
            {isLoginVisible && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Login</h2>
                        <input
                            type="text"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={error ? 'error' : ''}
                        />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className={error ? 'error' : ''}
                        />
                        {error && <p className="error-message">{error}</p>}
                        <button onClick={closeLoginModal} style={{ border: '1px solid #22B14C' }}>Cancelar</button>
                        <button onClick={handleLogin} style={{ backgroundColor: '#22B14C', color: '#FFF' }}>Entrar</button>
                    </div>
                </div>
            )}
            <div id="mae">
                <aside>
                    {empresa && (
                        <Primeira
                            foto={usuarioLogado ? usuarioLogado.foto : empresa.logo}
                            nome={usuarioLogado ? usuarioLogado.nickname : empresa.nome}
                            inscricoes={0}
                            onOpenLogin={openLoginModal}
                            onLogout={handleLogout}
                            isLoggedIn={!!usuarioLogado}
                        />
                    )}
                </aside>
                <main>
                    <div className='cursosDiv'>
                        <div className='apenasdiv'>
                            <h1>Cursos</h1>
                        </div>
                        {cursos.map(curso => (
                            <Terceira
                                key={curso.id_curso}
                                idCurso={curso.id_curso}
                                nomeCurso={curso.nome_curso}
                                instituicao={curso.instituicao}
                                foto={curso.foto}
                                like="flecha_cima_vazia.svg"
                                onOpenLogin={openLoginModal}
                                isLoggedIn={!!usuarioLogado}
                                editar="lapis_editar.svg"
                                deletar="lixeira_deletar.svg"
                            />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
