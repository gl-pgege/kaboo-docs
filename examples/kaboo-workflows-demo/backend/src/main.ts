import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import { HttpAgent } from '@ag-ui/client';
import {
  createKabooRunner,
  InMemoryThreadStore,
  PostgresThreadStore,
  type ThreadStore,
} from '@pgege/kaboo-runtime';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const pipelineUrl =
    process.env.PIPELINE_SERVICE_URL || 'http://localhost:8080/invocations';

  // kaboo-runtime persists the full AG-UI event log (messages + tools + state +
  // activity) and replays it on reload, and injects each thread's kaboo_history
  // into runs so the browser is no longer the custodian of history.
  const dsn = process.env.DATABASE_URL;
  const store: ThreadStore = dsn
    ? new PostgresThreadStore({ dsn })
    : new InMemoryThreadStore();

  const runtime = new CopilotRuntime({
    agents: {
      research_pipeline: new HttpAgent({ url: pipelineUrl }),
    },
    runner: createKabooRunner(store),
  });

  const copilotRouter = createCopilotExpressHandler({
    runtime,
    basePath: '/api/copilotkit',
  });

  app.use(copilotRouter);
  app.enableCors();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`CopilotKit Runtime proxying to ${pipelineUrl}`);
  console.log(
    `kaboo-runtime persistence: ${dsn ? 'PostgresThreadStore' : 'InMemoryThreadStore'}`,
  );
}
bootstrap();
