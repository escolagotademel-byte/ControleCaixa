async function renderPrevisao() {
    setTitulo(
        "Fluxo Previsto",
        "Próximos meses com lançamentos, mensalidades e recorrências"
    );

    const [
        entradas,
        saidas,
        recorrencias,
        mensalidades
    ] = await Promise.all([
        buscar("entradas"),
        buscar("saidas"),
        buscar("recorrencias"),
        buscar("mensalidades")
    ]);

    const meses = [];
    const base = new Date();

    for (let indice = 0; indice < 12; indice++) {
        const data = new Date(
            base.getFullYear(),
            base.getMonth() + indice,
            1
        );

        meses.push(
            `${data.getFullYear()}-` +
            `${String(data.getMonth() + 1).padStart(2, "0")}`
        );
    }

    const html = meses.map(chaveMes => {
        const lancamentos = [];

        // Entradas cadastradas manualmente
        entradas
            .filter(item =>
                item.data &&
                mesAnoKey(item.data) === chaveMes
            )
            .forEach(item => {
                lancamentos.push({
                    data: item.data,
                    descricao: item.descricao,
                    valor: Number(item.valor || 0),
                    tipo: "entrada",
                    origem: "manual"
                });
            });

        // Saídas cadastradas manualmente
        saidas
            .filter(item =>
                item.data &&
                mesAnoKey(item.data) === chaveMes
            )
            .forEach(item => {
                lancamentos.push({
                    data: item.data,
                    descricao: item.descricao,
                    valor: Number(item.valor || 0),
                    tipo: "saida",
                    origem: "manual"
                });
            });

        // Mensalidades previstas
        mensalidades
            .filter(item => {
                const competencia =
                    item.competencia?.slice(0, 7);

                return competencia === chaveMes;
            })
            .forEach(item => {
                lancamentos.push({
                    data:
                        item.vencimento ||
                        `${chaveMes}-10`,

                    descricao:
                        `Mensalidade - ${item.aluno}`,

                    valor: Number(item.valor || 0),

                    tipo: "entrada",

                    origem: "mensalidade",

                    pago: item.pago === true
                });
            });

        // Entradas e saídas recorrentes
        recorrencias
            .filter(item => item.ativo !== false)
            .forEach(item => {
                const dia = Math.min(
                    Number(item.dia || 1),
                    28
                );

                const data =
                    `${chaveMes}-` +
                    `${String(dia).padStart(2, "0")}`;

                lancamentos.push({
                    data,
                    descricao: item.descricao,
                    valor: Number(item.valor || 0),
                    tipo: item.tipo,
                    origem: "recorrente"
                });
            });

        lancamentos.sort((a, b) =>
            a.data.localeCompare(b.data)
        );

        const totalEntradas = lancamentos
            .filter(item => item.tipo === "entrada")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const totalSaidas = lancamentos
            .filter(item => item.tipo === "saida")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        const saldo = totalEntradas - totalSaidas;

        return `
            <div
                class="mes-card"
                onclick="this.classList.toggle('aberto')"
            >
                <div class="mes-head">
                    <h3>
                        ${saldo >= 0 ? "🟢" : "🔴"}
                        ${nomeMes(chaveMes)}
                    </h3>

                    <div>
                        <small>Entradas</small>
                        <strong>
                            ${moeda(totalEntradas)}
                        </strong>
                    </div>

                    <div>
                        <small>Saídas</small>
                        <strong>
                            ${moeda(totalSaidas)}
                        </strong>
                    </div>

                    <div>
                        <small>Saldo</small>

                        <strong
                            class="${
                                saldo >= 0
                                    ? "valor-pos"
                                    : "valor-neg"
                            }"
                        >
                            ${moeda(saldo)}
                        </strong>
                    </div>
                </div>

                <div class="mes-detalhes">
                    ${
                        lancamentos.length
                            ? lancamentos.map(item => {
                                let identificacao = "";

                                if (
                                    item.origem ===
                                    "recorrente"
                                ) {
                                    identificacao = " (fixo)";
                                }

                                if (
                                    item.origem ===
                                    "mensalidade"
                                ) {
                                    identificacao =
                                        item.pago
                                            ? " (mensalidade paga)"
                                            : " (mensalidade prevista)";
                                }

                                return `
                                    <div class="lancamento">
                                        <span>
                                            ${dataBR(item.data)}
                                            -
                                            ${escapeHtml(
                                                item.descricao
                                            )}
                                            ${identificacao}
                                        </span>

                                        <strong
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

                                            ${moeda(item.valor)}
                                        </strong>
                                    </div>
                                `;
                            }).join("")
                            : `
                                <p class="msg">
                                    Sem lançamentos neste mês.
                                </p>
                            `
                    }
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("app").innerHTML = `
        <div class="painel">
            <p class="desc">
                Clique em um mês para expandir e ver os lançamentos.
            </p>

            ${html}
        </div>
    `;
}
