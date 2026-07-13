let saidaEditando = null;

async function renderSaidas() {
    setTitulo("Saídas", "Cadastre despesas e pagamentos");

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="painel">
            <div class="toolbar">
                <input
                    id="buscaSaida"
                    placeholder="Pesquisar descrição..."
                    oninput="listarSaidas()"
                >

                <button class="btn blue" onclick="abrirFormSaida()">
                    + Nova Saída
                </button>
            </div>

            <div id="formSaida"></div>
            <div id="listaSaidas"></div>
        </div>
    `;

    await listarSaidas();
}

function abrirFormSaida(item = null) {
    saidaEditando = item;

    document.getElementById("formSaida").innerHTML = `
        <div class="form">
            <div class="field">
                <label>Data</label>

                <input
                    type="date"
                    id="saidaData"
                    value="${item?.data || hojeISO()}"
                >
            </div>

            <div class="field">
                <label>Descrição</label>

                <input
                    id="saidaDescricao"
                    value="${escapeHtml(item?.descricao || "")}"
                    placeholder="Ex: Conta de luz"
                >
            </div>

            <div class="field">
                <label>Valor</label>

                <input
                    type="number"
                    step="0.01"
                    id="saidaValor"
                    value="${item?.valor || ""}"
                >
            </div>

            <button class="btn green" onclick="salvarSaida()">
                ${item ? "Salvar Alterações" : "Cadastrar"}
            </button>
        </div>
    `;
}

async function salvarSaida() {
    const data = document.getElementById("saidaData").value;
    const descricao = document
        .getElementById("saidaDescricao")
        .value
        .trim();

    const valor = Number(
        document.getElementById("saidaValor").value
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
        if (saidaEditando) {
            await atualizar(
                "saidas",
                saidaEditando.id,
                obj
            );
        } else {
            await inserir("saidas", obj);
        }

        saidaEditando = null;

        alert("Saída salva com sucesso!");

        await navegar("dashboard");
    } catch (erro) {
        console.error("Erro ao salvar saída:", erro);

        alert(
            "Não foi possível salvar a saída. " +
            (erro.message || "")
        );
    }
}

async function listarSaidas() {
    const busca = (
        document.getElementById("buscaSaida")?.value || ""
    ).toLowerCase();

    try {
        let itens = await buscar("saidas");

        itens = itens.filter(item =>
            item.descricao.toLowerCase().includes(busca)
        );

        const lista = document.getElementById("listaSaidas");

        if (!itens.length) {
            lista.innerHTML =
                '<p class="msg">Nenhuma saída encontrada.</p>';

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
                                        onclick='abrirFormSaida(${JSON.stringify(item)})'
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="btn red"
                                        onclick="excluirSaida(${item.id})"
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
        console.error("Erro ao listar saídas:", erro);

        document.getElementById("listaSaidas").innerHTML = `
            <p class="msg">
                Erro ao carregar saídas: ${escapeHtml(erro.message)}
            </p>
        `;
    }
}

async function excluirSaida(id) {
    const confirmar = confirm(
        "Deseja realmente excluir esta saída?"
    );

    if (!confirmar) {
        return;
    }

    try {
        await remover("saidas", id);

        alert("Saída excluída com sucesso!");

        await listarSaidas();
    } catch (erro) {
        console.error("Erro ao excluir saída:", erro);

        alert(
            "Não foi possível excluir a saída. " +
            (erro.message || "")
        );
    }
}
