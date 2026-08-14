import {
  bootstrapDatabase,
  createDatabaseClient,
  createSqliteConnection,
  DrizzleProductEventRepository,
} from "@/infrastructure/db";

import { ProductEventService } from "./service";

export async function createLocalProductEventService(): Promise<{
  service: ProductEventService;
  close: () => void;
}> {
  const sqlite = createSqliteConnection();
  const db = createDatabaseClient(sqlite);

  await bootstrapDatabase(db);

  return {
    service: new ProductEventService(new DrizzleProductEventRepository(db)),
    close: () => sqlite.close(),
  };
}
