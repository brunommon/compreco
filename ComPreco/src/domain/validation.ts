export interface ValidationError {
  campo: string;
  mensagem: string;
}

export function validarProduto(input: { nome: string; preco: number; quantidade: number }): ValidationError[] {
  const erros: ValidationError[] = [];

  if (!input.nome || input.nome.trim().length === 0) {
    erros.push({ campo: 'nome', mensagem: 'nome é obrigatório' });
  }
  if (!(input.preco > 0)) {
    erros.push({ campo: 'preco', mensagem: 'preço deve ser maior que zero' });
  }
  if (!(input.quantidade > 0)) {
    erros.push({ campo: 'quantidade', mensagem: 'quantidade deve ser maior que zero' });
  }

  return erros;
}

export function validarCategoria(categoria: string): ValidationError[] {
  if (!categoria || categoria.trim().length === 0) {
    return [{ campo: 'categoria', mensagem: 'categoria é obrigatória' }];
  }
  return [];
}
