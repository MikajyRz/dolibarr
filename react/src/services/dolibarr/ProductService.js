import { dolibarrClient } from './dolibarrClient'

export const ProductService = {
  getProducts: async () => {
    return await dolibarrClient.get('/products', {
      limit: 50,
      sortfield: 't.ref',
      sortorder: 'ASC',
    })
  },
}