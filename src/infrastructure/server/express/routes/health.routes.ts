import { Request, Response, Router } from 'express';

export const createHealthRoutes = (): Router => {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
  });

  return router;
};
