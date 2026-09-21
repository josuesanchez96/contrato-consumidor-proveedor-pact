import express, { Request, Response } from 'express';
import { inventoryDb } from './inventoryDb';

export function createInventoryApp() {
  const app = express();
  app.use(express.json());

  app.get('/inventory/:sku', (req: Request, res: Response) => {
    const { sku } = req.params;
    const item = inventoryDb.getItem(sku);

    if (!item) {
      return res.status(404).json({
        error: `SKU '${sku}' not found in inventory`,
      });
    }

    return res.status(200).json({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      status: item.status,
    });
  });

  return app;
}
