import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

describe('todorist-v2 API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('returns health status', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' });
  });

  it('supports registration, team invitation and task collaboration', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerEmail = `owner-${suffix}@example.com`;
    const memberEmail = `member-${suffix}@example.com`;
    const owner = request.agent(app.getHttpServer());
    const member = request.agent(app.getHttpServer());

    await owner
      .post('/api/auth/register')
      .send({
        name: 'Owner',
        email: ownerEmail,
        password: 'test-password-123',
        passwordConfirmation: 'test-password-123',
      })
      .expect(201);
    await member
      .post('/api/auth/register')
      .send({
        name: 'Member',
        email: memberEmail,
        password: 'test-password-456',
        passwordConfirmation: 'test-password-456',
      })
      .expect(201);

    const teamResponse = await owner
      .post('/api/teams')
      .send({ name: `E2E ${suffix.slice(-8)}` })
      .expect(201);
    const teamId = teamResponse.body.id as string;
    expect(teamResponse.body.role).toBe('owner');
    await member
      .post('/api/teams')
      .send({ name: String(teamResponse.body.name).toLocaleLowerCase('en-US') })
      .expect(409);
    await owner.post('/api/teams/' + teamId + '/leave').expect(409);

    const invitationResponse = await owner
      .post(`/api/teams/${teamId}/invitations`)
      .send({ email: memberEmail })
      .expect(201);
    await member
      .post(
        `/api/invitations/${invitationResponse.body.token as string}/accept`,
      )
      .expect(201);

    const membersResponse = await owner
      .get(`/api/teams/${teamId}/members`)
      .expect(200);
    expect(membersResponse.body.items).toHaveLength(2);
    const memberUser = membersResponse.body.items.find(
      (item: { user: { email: string } }) => item.user.email === memberEmail,
    );

    const taskResponse = await owner
      .post(`/api/teams/${teamId}/tasks`)
      .send({
        title: 'E2E task',
        description: 'Shared task',
        assigneeId: memberUser.user.id,
        startDate: '2026-08-03',
        deadline: '2026-08-10',
        status: 'todo',
      })
      .expect(201);
    expect(taskResponse.body.startDate).toBe('2026-08-03');
    await owner
      .post(`/api/teams/${teamId}/tasks`)
      .send({
        title: 'Invalid range',
        startDate: '2026-08-11',
        deadline: '2026-08-10',
        status: 'todo',
      })
      .expect(400);

    const listResponse = await member
      .get(`/api/teams/${teamId}/tasks`)
      .expect(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].assignee.email).toBe(memberEmail);

    const ownerComment = await owner
      .post(`/api/tasks/${taskResponse.body.id as string}/comments`)
      .send({ message: 'Owner comment' })
      .expect(201);
    const memberCommentList = await member
      .get(`/api/tasks/${taskResponse.body.id as string}/comments`)
      .expect(200);
    expect(memberCommentList.body.items).toHaveLength(1);
    expect(memberCommentList.body.items[0].message).toBe('Owner comment');
    await member
      .delete(`/api/comments/${ownerComment.body.id as string}`)
      .expect(403);
    const memberComment = await member
      .post(`/api/tasks/${taskResponse.body.id as string}/comments`)
      .send({ message: 'Member comment' })
      .expect(201);
    await member
      .delete(`/api/comments/${memberComment.body.id as string}`)
      .expect(204);

    const ownerMessage = await owner
      .post(`/api/teams/${teamId}/messages`)
      .send({ message: 'Owner chat message' })
      .expect(201);
    const memberMessageList = await member
      .get(`/api/teams/${teamId}/messages`)
      .expect(200);
    expect(memberMessageList.body.items).toHaveLength(1);
    expect(memberMessageList.body.items[0].message).toBe('Owner chat message');
    await member
      .delete(`/api/messages/${ownerMessage.body.id as string}`)
      .expect(403);
    const memberMessage = await member
      .post(`/api/teams/${teamId}/messages`)
      .send({ message: 'Member chat message' })
      .expect(201);
    await member
      .delete(`/api/messages/${memberMessage.body.id as string}`)
      .expect(204);

    await member
      .post(`/api/teams/${teamId}/pull-requests`)
      .send({ title: 'Invalid URL', url: 'github.com/example/repo/pull/1' })
      .expect(400);
    const pullRequestShare = await member
      .post(`/api/teams/${teamId}/pull-requests`)
      .send({
        title: 'E2E pull request',
        url: 'https://github.com/example/repo/pull/1',
        assigneeId: memberUser.user.id,
        taskId: taskResponse.body.id,
        status: 'draft',
        memo: 'Please review',
      })
      .expect(201);
    const pullRequestList = await owner
      .get(`/api/teams/${teamId}/pull-requests`)
      .expect(200);
    expect(pullRequestList.body.items).toHaveLength(1);
    expect(pullRequestList.body.items[0].task.title).toBe('E2E task');
    const updatedPullRequestShare = await owner
      .patch(`/api/pull-requests/${pullRequestShare.body.id as string}`)
      .send({ status: 'review', version: pullRequestShare.body.version })
      .expect(200);
    expect(updatedPullRequestShare.body.status).toBe('review');
    expect(updatedPullRequestShare.body.version).toBe(2);
    await member
      .patch(`/api/pull-requests/${pullRequestShare.body.id as string}`)
      .send({ status: 'merged', version: pullRequestShare.body.version })
      .expect(409);

    const updated = await member
      .patch(`/api/tasks/${taskResponse.body.id as string}`)
      .send({
        status: 'working',
        version: taskResponse.body.version,
      })
      .expect(200);
    expect(updated.body.status).toBe('working');
    expect(updated.body.version).toBe(2);
    await owner
      .patch(`/api/tasks/${taskResponse.body.id as string}`)
      .send({ status: 'done', version: taskResponse.body.version })
      .expect(409);

    await member
      .patch(`/api/teams/${teamId}`)
      .send({
        name: 'Unauthorized rename',
        version: teamResponse.body.version,
      })
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/teams/${teamId}/tasks`)
      .expect(401);

    await owner
      .delete(`/api/tasks/${taskResponse.body.id as string}?version=2`)
      .expect(204);
    expect(
      await prisma.taskComment.count({
        where: { taskId: taskResponse.body.id as string },
      }),
    ).toBe(0);
    const sharesAfterTaskDelete = await owner
      .get(`/api/teams/${teamId}/pull-requests`)
      .expect(200);
    expect(sharesAfterTaskDelete.body.items).toHaveLength(1);
    expect(sharesAfterTaskDelete.body.items[0].taskId).toBeNull();
    expect(sharesAfterTaskDelete.body.items[0].task).toBeNull();
    await owner
      .delete(
        `/api/teams/${teamId}?version=${teamResponse.body.version as number}`,
      )
      .expect(204);
    expect(await prisma.chatMessage.count({ where: { teamId } })).toBe(0);
    expect(await prisma.pullRequestShare.count({ where: { teamId } })).toBe(0);
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, memberEmail] } },
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
