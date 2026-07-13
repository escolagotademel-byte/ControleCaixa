let ultimoRelatorio = [];

async function renderRelatorios() {
    setTitulo(
        "Relatórios",
        "Filtre por período e exporte os lançamentos"
    );

    document.getElementById("app").innerHTML = `
        <div class="painel">

            <div class="toolbar">

                <input
                    type="date"
                    id="relIni"
                >

                <input
                    type="date"
                    id="relFim"
                >

                <select id="relTipo">
                    <option value="todos">
                        Todos
                    </option>

                    <option value="entrada">
                        Entradas
                    </option>

                    <option value="saida">
                        Saídas
                    </option>

                    <option value="mensalidade">
                        Mensalidades pagas
                    </option>
                </select>

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

            <div id="resultadoRelatorio"></div>

        </div>
    `;

    await gerarRelatorio();
}

async function gerarRelatorio() {
    const dataInicial =
        document.getElementById("relIni")?.value;

    const dataFinal =
        document.getElementById("relFim")?.value;

    const tipoSelecionado =
        document.getElementById("relTipo")?.value ||
        "todos";

    try {
        const [
            entradas,
            saidas,
            mensalidades
        ] = await Promise.all([
            buscar("entradas"),
            buscar("saidas"),
            buscar("mensalidades")
        ]);

        const entradasFormatadas = entradas.map(item => ({
            id: item.id,
            data: item.data,
            tipo: "entrada",
            origem: "entrada",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        }));

        const saidasFormatadas = saidas.map(item => ({
            id: item.id,
            data: item.data,
            tipo: "saida",
            origem: "saida",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        }));

        /*
         * Somente mensalidades efetivamente pagas
         * entram no relatório financeiro.
         */
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
                    valor: Number(item.valor || 0),
                    competencia:
                        item.competencia
                            ? item.competencia.slice(0, 7)
                            : null
                }));

        let itens = [
            ...entradasFormatadas,
            ...saidasFormatadas,
            ...mensalidadesPagas
        ];

        /*
         * Filtro por tipo.
         *
         * "Entradas" inclui:
         * - entradas manuais;
         * - mensalidades pagas.
         */
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
                item => item.origem === "mensalidade"
            );
        }

        if (dataInicial) {
            itens = itens.filter(
                item =>
                    item.data &&
                    item.data >= dataInicial
            );
        }

        if (dataFinal) {
            itens = itens.filter(
                item =>
                    item.data &&
                    item.data <= dataFinal
            );
        }

        itens.sort((a, b) =>
            b.data.localeCompare(a.data)
        );

        ultimoRelatorio = itens;

        const totalEntradas = itens
            .filter(item => item.tipo === "entrada")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalSaidas = itens
            .filter(item => item.tipo === "saida")
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

        const saldo =
            totalEntradas - totalSaidas;

        document.getElementById(
            "resultadoRelatorio"
        ).innerHTML = `

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

            ${
                itens.length
                    ? `
                        <table class="table">

                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${itens.map(item => {

                                    let nomeTipo = "";

                                    if (
                                        item.origem ===
                                        "mensalidade"
                                    ) {
                                        nomeTipo =
                                            "Mensalidade";
                                    } else if (
                                        item.tipo ===
                                        "entrada"
                                    ) {
                                        nomeTipo =
                                            "Entrada";
                                    } else {
                                        nomeTipo =
                                            "Saída";
                                    }

                                    return `
                                        <tr>

                                            <td>
                                                ${dataBR(
                                                    item.data
                                                )}
                                            </td>

                                            <td>
                                                ${nomeTipo}
                                            </td>

                                            <td>
                                                ${escapeHtml(
                                                    item.descricao
                                                )}

                                                ${
                                                    item.origem ===
                                                        "mensalidade" &&
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
                                                    item.tipo ===
                                                    "entrada"
                                                        ? "valor-pos"
                                                        : "valor-neg"
                                                }"
                                            >
                                                ${
                                                    item.tipo ===
                                                    "entrada"
                                                        ? "+"
                                                        : "-"
                                                }

                                                ${moeda(
                                                    item.valor
                                                )}
                                            </td>

                                        </tr>
                                    `;
                                }).join("")}

                            </tbody>

                        </table>
                    `
                    : `
                        <p class="msg">
                            Nenhum lançamento encontrado.
                        </p>
                    `
            }
        `;

    } catch (erro) {
        console.error(
            "Erro ao gerar relatório:",
            erro
        );

        document.getElementById(
            "resultadoRelatorio"
        ).innerHTML = `
            <p class="msg">
                Não foi possível gerar o relatório:
                ${escapeHtml(erro.message || "")}
            </p>
        `;
    }
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
            "Tipo",
            "Descrição",
            "Competência",
            "Valor"
        ],

        ...ultimoRelatorio.map(item => {

            let nomeTipo = "";

            if (item.origem === "mensalidade") {
                nomeTipo = "Mensalidade";
            } else if (item.tipo === "entrada") {
                nomeTipo = "Entrada";
            } else {
                nomeTipo = "Saída";
            }

            return [
                dataBR(item.data),
                nomeTipo,
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
