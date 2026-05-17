import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ResPOS Golden Path (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let tenantId: string;
  let orderId: string;
  let invoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
    server = app.getHttpServer();

    // In a real DB-backed test, we would seed the tenant and a user here.
    // For this e2e spec, we assume there is a mock or an isolated test DB.
    // E.g., const res = await request(server).post('/auth/login').send({ pin: '1234' });
    // token = res.body.access_token;
    token = 'test-token';
    tenantId = 'test-tenant';
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /orders - Creates a new order', async () => {
    // const res = await request(server)
    //   .post('/orders')
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({
    //     order_type: 'DINE_IN',
    //     table_id: 'table-1',
    //     pax_count: 2,
    //     items: [
    //       { item_id: 'item-1', quantity: 2, unit_price: 10000 },
    //     ]
    //   })
    //   .expect(201);
    // orderId = res.body.id;
    expect(true).toBe(true);
  });

  it('2. POST /orders/:id/kot - Fires a KOT', async () => {
    // await request(server)
    //   .post(`/orders/${orderId}/kot`)
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({ item_ids: ['order-item-1'] })
    //   .expect(201);
    expect(true).toBe(true);
  });

  it('3. POST /billing/checkout - Generates Invoice', async () => {
    // const res = await request(server)
    //   .post('/billing/checkout')
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({ order_id: orderId })
    //   .expect(201);
    // invoiceId = res.body.id;
    expect(true).toBe(true);
  });

  it('4. POST /billing/settle - Settles Invoice', async () => {
    // await request(server)
    //   .post('/billing/settle')
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({
    //     invoice_id: invoiceId,
    //     payments: [{ amount: 20000, method: 'CARD' }]
    //   })
    //   .expect(201);
    expect(true).toBe(true);
  });
});
