import Component from 'vue-class-component'
import {BaseAPI} from '@/api/base'
import {Product, ShopAPI} from '@/api/types'

@Component
export class ShopAPIImpl extends BaseAPI implements ShopAPI {
  async getProducts(): Promise<Product[]> {
    const response = await this.get<Product[]>('products')
    return response.data
  }

  buyProducts(products: Array<{id: string; quantity: number}>): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // simulate random checkout failure.
        Math.random() > 0.5 || navigator.userAgent.indexOf('PhantomJS') > -1 ? resolve() : reject()
      }, 100)
    })
  }
}