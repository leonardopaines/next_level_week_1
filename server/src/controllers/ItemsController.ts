import { Request, Response } from 'express';
import connection from '../database/connection';

class ItemsController {
    async index(request: Request, response: Response) {

        const items = await connection('items').select('*');

        const serializeItems = items.map(item => {
            return {
                id: item.id,
                title: item.title,
                image_url: `http://localhost:3333/uploads/${item.image}`
            }
        });

        return response.json(serializeItems);
    }
}

export default ItemsController;