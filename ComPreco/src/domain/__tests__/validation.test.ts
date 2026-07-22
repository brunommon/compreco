import { validarProduto, validarCategoria } from '../validation';

describe('validarProduto', () => {
  it('deve retornar lista vazia quando produto é válido', () => {
    expect(validarProduto({ nome: 'Arroz', preco: 10, quantidade: 1 })).toEqual([]);
  });

  it('deve retornar erro quando preço é zero', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: 0, quantidade: 1 });
    expect(erros).toEqual([{ campo: 'preco', mensagem: 'preço deve ser maior que zero' }]);
  });

  it('deve retornar erro quando preço é negativo', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: -5, quantidade: 1 });
    expect(erros).toContainEqual({ campo: 'preco', mensagem: 'preço deve ser maior que zero' });
  });

  it('deve retornar erro quando quantidade é zero', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: 10, quantidade: 0 });
    expect(erros).toEqual([{ campo: 'quantidade', mensagem: 'quantidade deve ser maior que zero' }]);
  });

  it('deve retornar erro quando nome é vazio', () => {
    const erros = validarProduto({ nome: '', preco: 10, quantidade: 1 });
    expect(erros).toEqual([{ campo: 'nome', mensagem: 'nome é obrigatório' }]);
  });

  it('deve retornar múltiplos erros quando múltiplos campos são inválidos', () => {
    const erros = validarProduto({ nome: '', preco: 0, quantidade: 0 });
    expect(erros).toHaveLength(3);
  });
});

describe('validarCategoria', () => {
  it('deve retornar lista vazia quando categoria é válida', () => {
    expect(validarCategoria('Arroz')).toEqual([]);
  });

  it('deve retornar erro quando categoria é vazia', () => {
    expect(validarCategoria('')).toEqual([{ campo: 'categoria', mensagem: 'categoria é obrigatória' }]);
  });

  it('deve retornar erro quando categoria só tem espaços', () => {
    expect(validarCategoria('   ')).toEqual([{ campo: 'categoria', mensagem: 'categoria é obrigatória' }]);
  });
});
