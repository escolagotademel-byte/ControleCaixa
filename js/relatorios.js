let ultimoRelatorio = [];

async function renderRelatorios() {
    setTitulo(
        "Relatórios",
        "Consulte entradas, saídas, mensalidades e recorrências"
    );

    document.getElementById("app").innerHTML = `
        <div class="painel">

            <div class="toolbar">

                <div class="field">
                    <label>Data inicial</label>
                    <input type="date" id="relIni">
                </div>

                <div class="field">
                    <label>Data final</label>
                    <input type="date" id="relFim">
                </div>

                <div class="field">
                    <label>Tipo</label>

                    <select id="relTipo">
                        <option value="todos">
                            Todos
                        </option>

                        <option value="entrada">
                            Todas as entradas
                        </option>

                        <option value="saida">
                            Todas as saídas
                        </option>

                        <option value="mensalidade">
                            Mensalidades pagas
                        </option>

                        <option value="recorrente">
                            Somente recorrências
                        </option>
                    </select>
                </div>

                <button
                    class="btn blue"
                    onclick="gerarRelatorio()"
                >
                    Gerar
                </button>

                <button
                    class="btn green"
                    onclick="exportarRelatorio()"
                >
                    Exportar Excel/CSV
                </button>

                <button
                    class="btn sec"
                    onclick="window.print()"
                >
                    Imprimir/PDF
                </button>

            </div>

            <div id="cabecalhoImpressao" class="cabecalho-impressao"></div>

<div id="resultadoRelatorio"></div>

        </div>
    `;

    definirPeriodoAtualRelatorio();

    await gerarRelatorio();
}


function definirPeriodoAtualRelatorio() {
    const hoje = new Date();

    const primeiroDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
    );

    const ultimoDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0
    );

    document.getElementById("relIni").value =
        converterDataParaInput(primeiroDia);

    document.getElementById("relFim").value =
        converterDataParaInput(ultimoDia);
}


function converterDataParaInput(data) {
    const ano = data.getFullYear();

    const mes = String(
        data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function criarDataLocal(dataTexto) {
    if (!dataTexto) {
        return null;
    }

    const partes = dataTexto.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );
}


function gerarRecorrenciasNoPeriodo(
    recorrencias,
    dataInicial,
    dataFinal
) {
    const resultados = [];

    const inicio = criarDataLocal(dataInicial);
    const fim = criarDataLocal(dataFinal);

    if (!inicio || !fim) {
        return resultados;
    }

    recorrencias
        .filter(item => item.ativo !== false)
        .forEach(item => {

            let ano = inicio.getFullYear();
            let mes = inicio.getMonth();

            const anoFinal = fim.getFullYear();
            const mesFinal = fim.getMonth();

            while (
                ano < anoFinal ||
                (
                    ano === anoFinal &&
                    mes <= mesFinal
                )
            ) {
                const ultimoDiaDoMes =
                    new Date(
                        ano,
                        mes + 1,
                        0
                    ).getDate();

                const diaRecorrencia = Math.min(
                    Number(item.dia || 1),
                    ultimoDiaDoMes
                );

                const dataRecorrencia =
                    new Date(
                        ano,
                        mes,
                        diaRecorrencia
                    );

                if (
                    dataRecorrencia >= inicio &&
                    dataRecorrencia <= fim
                ) {
                    resultados.push({
                        id:
                            `recorrencia-${item.id}-` +
                            `${ano}-${mes + 1}`,

                        data:
                            converterDataParaInput(
                                dataRecorrencia
                            ),

                        tipo:
                            item.tipo === "entrada"
                                ? "entrada"
                                : "saida",

                        origem: "recorrencia",

                        descricao: item.descricao,

                        valor: Number(
                            item.valor || 0
                        ),

                        competencia:
                            `${ano}-` +
                            `${String(
                                mes + 1
                            ).padStart(2, "0")}`
                    });
                }

                mes++;

                if (mes > 11) {
                    mes = 0;
                    ano++;
                }
            }
        });

    return resultados;
}


async function gerarRelatorio() {
    const dataInicial =
        document.getElementById("relIni")?.value || "";

    const dataFinal =
        document.getElementById("relFim")?.value || "";

    const tipoSelecionado =
        document.getElementById("relTipo")?.value ||
        "todos";

    const resultado =
        document.getElementById(
            "resultadoRelatorio"
        );

    if (!dataInicial || !dataFinal) {
        alert(
            "Informe a data inicial e a data final."
        );

        return;
    }

    if (dataInicial > dataFinal) {
        alert(
            "A data inicial não pode ser maior que a data final."
        );

        return;
    }

    resultado.innerHTML = `
        <p class="msg">
            Carregando relatório...
        </p>
    `;

    try {
        const [
            entradas,
            saidas,
            mensalidades,
            recorrencias
        ] = await Promise.all([
            buscar("entradas"),
            buscar("saidas"),
            buscar("mensalidades"),
            buscar("recorrencias")
        ]);

        const entradasFormatadas =
            entradas.map(item => ({
                id: item.id,
                data: item.data,
                tipo: "entrada",
                origem: "manual",
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                competencia: ""
            }));

        const saidasFormatadas =
            saidas.map(item => ({
                id: item.id,
                data: item.data,
                tipo: "saida",
                origem: "manual",
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                competencia: ""
            }));

        const mensalidadesPagas =
            mensalidades
                .filter(item =>
                    item.pago === true &&
                    item.data_pagamento
                )
                .map(item => ({
                    id: item.id,
                    data: item.data_pagamento,
                    tipo: "entrada",
                    origem: "mensalidade",

                    descricao:
                        `Mensalidade - ${item.aluno}`,

                    valor: Number(
                        item.valor || 0
                    ),

                    competencia:
                        item.competencia
                            ? item.competencia.slice(
                                0,
                                7
                            )
                            : ""
                }));

        const recorrenciasDoPeriodo =
            gerarRecorrenciasNoPeriodo(
                recorrencias,
                dataInicial,
                dataFinal
            );

        let itens = [
            ...entradasFormatadas,
            ...saidasFormatadas,
            ...mensalidadesPagas,
            ...recorrenciasDoPeriodo
        ];

        itens = itens.filter(item =>
            item.data &&
            item.data >= dataInicial &&
            item.data <= dataFinal
        );

        if (tipoSelecionado === "entrada") {
            itens = itens.filter(
                item => item.tipo === "entrada"
            );
        }

        if (tipoSelecionado === "saida") {
            itens = itens.filter(
                item => item.tipo === "saida"
            );
        }

        if (tipoSelecionado === "mensalidade") {
            itens = itens.filter(
                item =>
                    item.origem === "mensalidade"
            );
        }

        if (tipoSelecionado === "recorrente") {
            itens = itens.filter(
                item =>
                    item.origem === "recorrencia"
            );
        }

        itens.sort((a, b) =>
            b.data.localeCompare(a.data)
        );

        ultimoRelatorio = itens;

        const totalEntradas = itens
            .filter(
                item => item.tipo === "entrada"
            )
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalSaidas = itens
            .filter(
                item => item.tipo === "saida"
            )
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalMensalidades = itens
            .filter(
                item =>
                    item.origem === "mensalidade"
            )
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalEntradasRecorrentes = itens
            .filter(item =>
                item.origem === "recorrencia" &&
                item.tipo === "entrada"
            )
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalSaidasRecorrentes = itens
            .filter(item =>
                item.origem === "recorrencia" &&
                item.tipo === "saida"
            )
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const saldo =
            totalEntradas - totalSaidas;

        resultado.innerHTML = `
        
            <div class="cards">

                <div class="card azul">
                    <span>Entradas</span>

                    <strong>
                        ${moeda(totalEntradas)}
                    </strong>
                </div>

                <div class="card laranja">
                    <span>Saídas</span>

                    <strong>
                        ${moeda(totalSaidas)}
                    </strong>
                </div>

                <div class="card verde">
                    <span>Saldo</span>

                    <strong>
                        ${moeda(saldo)}
                    </strong>
                </div>

                <div class="card vermelho">
                    <span>Mensalidades pagas</span>

                    <strong>
                        ${moeda(totalMensalidades)}
                    </strong>
                </div>

            </div>

            <div class="painel">
                <h2>Resumo das recorrências</h2>

                <table class="table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>
                                Entradas recorrentes
                            </td>

                            <td class="valor-pos">
                                ${moeda(
                                    totalEntradasRecorrentes
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                Saídas recorrentes
                            </td>

                            <td class="valor-neg">
                                ${moeda(
                                    totalSaidasRecorrentes
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${
                itens.length
                    ? montarTabelaRelatorio(itens)
                    : `
                        <p class="msg">
                            Nenhum lançamento encontrado
                            para o período selecionado.
                        </p>
                    `
            }
        `;

        const hojeEmissao = new Date();

const dataEmissao = hojeEmissao.toLocaleDateString(
    "pt-BR"
);

const periodoInicialFormatado =
    dataInicial
        ? dataBR(dataInicial)
        : "Início";

const periodoFinalFormatado =
    dataFinal
        ? dataBR(dataFinal)
        : "Fim";

document.getElementById(
    "cabecalhoImpressao"
).innerHTML = `
    <h1>ESCOLA GOTA DE MEL</h1>

    <h2>RELATÓRIO FINANCEIRO</h2>

    <p>
        <strong>Período:</strong>
        ${periodoInicialFormatado}
        a
        ${periodoFinalFormatado}
    </p>

    <p>
        <strong>Data de emissão:</strong>
        ${dataEmissao}
    </p>
`;
    } catch (erro) {
        console.error(
            "Erro ao gerar relatório:",
            erro
        );

        resultado.innerHTML = `
            <p class="msg">
                Erro ao gerar relatório:
                ${escapeHtml(
                    erro.message || ""
                )}
            </p>
        `;
    }
}


function montarTabelaRelatorio(itens) {
    return `
        <table class="table">

            <thead>
                <tr>
                    <th>Data</th>
                    <th>Origem</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                </tr>
            </thead>

            <tbody>

                ${itens.map(item => {

                    let nomeOrigem = "Manual";

                    if (
                        item.origem === "mensalidade"
                    ) {
                        nomeOrigem = "Mensalidade";
                    }

                    if (
                        item.origem === "recorrencia"
                    ) {
                        nomeOrigem = "Recorrência";
                    }

                    const nomeTipo =
                        item.tipo === "entrada"
                            ? "Entrada"
                            : "Saída";

                    return `
                        <tr>

                            <td>
                                ${dataBR(item.data)}
                            </td>

                            <td>
                                ${nomeOrigem}
                            </td>

                            <td>
                                ${nomeTipo}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.descricao
                                )}

                                ${
                                    item.competencia
                                        ? `
                                            <br>

                                            <small>
                                                Competência:
                                                ${nomeMes(
                                                    item.competencia
                                                )}
                                            </small>
                                        `
                                        : ""
                                }
                            </td>

                            <td
                                class="${
                                    item.tipo === "entrada"
                                        ? "valor-pos"
                                        : "valor-neg"
                                }"
                            >
                                ${
                                    item.tipo === "entrada"
                                        ? "+"
                                        : "-"
                                }

                                ${moeda(item.valor)}
                            </td>

                        </tr>
                    `;
                }).join("")}

            </tbody>

        </table>
    `;
}


function exportarRelatorio() {
    if (!ultimoRelatorio.length) {
        alert(
            "Não existem lançamentos para exportar."
        );

        return;
    }

    const linhas = [
        [
            "Data",
            "Origem",
            "Tipo",
            "Descrição",
            "Competência",
            "Valor"
        ],

        ...ultimoRelatorio.map(item => {

            let nomeOrigem = "Manual";

            if (
                item.origem === "mensalidade"
            ) {
                nomeOrigem = "Mensalidade";
            }

            if (
                item.origem === "recorrencia"
            ) {
                nomeOrigem = "Recorrência";
            }

            return [
                dataBR(item.data),

                nomeOrigem,

                item.tipo === "entrada"
                    ? "Entrada"
                    : "Saída",

                item.descricao,

                item.competencia
                    ? nomeMes(item.competencia)
                    : "",

                Number(item.valor || 0)
                    .toFixed(2)
                    .replace(".", ",")
            ];
        })
    ];

    download(
        "relatorio-controle-caixa.csv",
        csv(linhas),
        "text/csv;charset=utf-8"
    );
}
