let entradaEditando = null;

async function renderEntradas() {
    setTitulo("Entradas", "Cadastre valores recebidos");

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="painel">
            <div class="toolbar">
                <input
                    id="buscaEntrada"
                    placeholder="Pesquisar descrição..."
                    oninput="listarEntradas()"
                >

                <button class="btn blue" onclick="abrirFormEntrada()">
                    + Nova Entrada
                </button>
            </div>

            <div id="formEntrada"></div>
            <div id="listaEntradas"></div>
        </div>
    `;

    await listarEntradas();
}

function abrirFormEntrada(item = null) {
    entradaEditando = item;

    document.getElementById("formEntrada").innerHTML = `
        <div class="form">
            <div class="field">
                <label>Data</label>

                <input
                    type="date"
                    id="entradaData"
                    value="${item?.data || hojeISO()}"
                >
            </div>

            <div class="field">
                <label>Descrição</label>

                <input
                    id="entradaDescricao"
                    value="${escapeHtml(item?.descricao || "")}"
                    placeholder="Ex: Mensalidade João"
                >
            </div>

            <div class="field">
                <label>Valor</label>

                <input
                    type="number"
                    step="0.01"
                    id="entradaValor"
                    value="${item?.valor || ""}"
                >
            </div>

            <button class="btn green" onclick="salvarEntrada()">
                ${item ? "Salvar Alterações" : "Cadastrar"}
            </button>
        </div>
    `;
}

async function salvarEntrada() {
    const data = document.getElementById("entradaData").value;
    const descricao = document
        .getElementById("entradaDescricao")
        .value
        .trim();

    const valor = Number(
        document.getElementById("entradaValor").value
    );

    if (!data || !descricao || !valor) {
        alert("Preencha data, descrição e valor.");
        return;
    }

    const obj = {
        data,
        descricao,
        valor
    };

    try {
        if (entradaEditando) {
            await atualizar(
                "entradas",
                entradaEditando.id,
                obj
            );
        } else {
            await inserir("entradas", obj);
        }

        entradaEditando = null;

        alert(
            entradaEditando
                ? "Entrada atualizada com sucesso!"
                : "Entrada cadastrada com sucesso!"
        );

        await navegar("dashboard");
    } catch (erro) {
        console.error("Erro ao salvar entrada:", erro);

        alert(
            "Não foi possível salvar a entrada. " +
            (erro.message || "")
        );
    }
}

async function listarEntradas() {
    const busca = (
        document.getElementById("buscaEntrada")?.value || ""
    ).toLowerCase();

    try {
        let itens = await buscar("entradas");

        itens = itens.filter(item =>
            item.descricao.toLowerCase().includes(busca)
        );

        const lista = document.getElementById("listaEntradas");

        if (!itens.length) {
            lista.innerHTML =
                '<p class="msg">Nenhuma entrada encontrada.</p>';

            return;
        }

        lista.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Ações</th>
                    </tr>
                </thead>

                <tbody>
                    ${itens.map(item => `
                        <tr>
                            <td>${dataBR(item.data)}</td>

                            <td>
                                ${escapeHtml(item.descricao)}
                            </td>

                            <td>
                                ${moeda(item.valor)}
                            </td>

                            <td>
                                <div class="actions">
                                    <button
                                        class="btn blue"
                                        onclick='abrirFormEntrada(${JSON.stringify(item)})'
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="btn red"
                                        onclick="excluirEntrada(${item.id})"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (erro) {
        console.error("Erro ao listar entradas:", erro);

        document.getElementById("listaEntradas").innerHTML = `
            <p class="msg">
                Erro ao carregar entradas: ${escapeHtml(erro.message)}
            </p>
        `;
    }
}

async function excluirEntrada(id) {
    const confirmar = confirm(
        "Deseja realmente excluir esta entrada?"
    );

    if (!confirmar) {
        return;
    }

    try {
        await remover("entradas", id);

        alert("Entrada excluída com sucesso!");

        await listarEntradas();
    } catch (erro) {
        console.error("Erro ao excluir entrada:", erro);

        alert(
            "Não foi possível excluir a entrada. " +
            (erro.message || "")
        );
    }
}
