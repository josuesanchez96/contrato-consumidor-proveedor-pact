import { createInventoryApp } from './inventoryApp';

const PORT = process.env.PORT || 3001;
const app = createInventoryApp();

app.listen(PORT, () => {
  console.log(`Inventory Provider Service running on port ${PORT}`);
});
