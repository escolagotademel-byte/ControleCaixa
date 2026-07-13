async function buscar(tabela) {
    let query = supabaseClient
        .from(tabela)
        .select('*');

    if (
        tabela === 'entradas'
        || tabela === 'saidas'
    ) {
        query = query.order(
            'data',
            { ascending: true }
        );
    }

    if (tabela === 'recorrencias') {
        query = query.order(
            'dia',
            { ascending: true }
        );
    }

    if (tabela === 'mensalidades') {
        query = query
            .order(
                'competencia',
                { ascending: true }
            )
            .order(
                'aluno',
                { ascending: true }
            );
    }

    if (tabela === 'configuracoes') {
        query = query.order(
            'chave',
            { ascending: true }
        );
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return data || [];
}

async function inserir(tabela, obj) {
    const { error } = await supabaseClient
        .from(tabela)
        .insert(obj);

    if (error) {
        throw error;
    }
}

async function atualizar(tabela, id, obj) {
    const { error } = await supabaseClient
        .from(tabela)
        .update(obj)
        .eq('id', id);

    if (error) {
        throw error;
    }
}

async function remover(tabela, id) {
    const { error } = await supabaseClient
        .from(tabela)
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
}

async function buscarConfig(chave) {
    const { data, error } = await supabaseClient
        .from('configuracoes')
        .select('*')
        .eq('chave', chave)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ? data.valor : null;
}

async function salvarConfig(chave, valor) {
    const { error } = await supabaseClient
        .from('configuracoes')
        .upsert(
            { chave, valor },
            { onConflict: 'chave' }
        );

    if (error) {
        throw error;
    }
}

async function testarConexao() {
    try {
        await buscar('entradas');

        document.getElementById(
            'statusConexao'
        ).textContent = 'Nuvem conectada';

        document.getElementById(
            'statusConexao'
        ).className = 'status ok';
    } catch (erro) {
        document.getElementById(
            'statusConexao'
        ).textContent = 'Erro na conexão';

        document.getElementById(
            'statusConexao'
        ).className = 'status erro';

        console.error(erro);
    }
}
