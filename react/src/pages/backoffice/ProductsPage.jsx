import { useEffect, useState } from 'react'
import { ProductService } from '../../services/dolibarr/ProductService'
import '../../styles/products-page.css'

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await ProductService.getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Produits</h1>
          <p>Liste des produits depuis Dolibarr</p>
        </div>

        <button onClick={loadProducts}>Actualiser</button>
      </div>

      {loading && <p>Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan="5">Aucun produit trouvé.</td>
                </tr>
              )}

              {products.map((product) => (
                <tr key={product.id || product.rowid}>
                  <td>{product.ref || '-'}</td>
                  <td>{product.label || '-'}</td>
                  <td>{product.price || '-'}</td>
                  <td>{product.stock_reel || '-'}</td>
                  <td>{product.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ProductsPage
