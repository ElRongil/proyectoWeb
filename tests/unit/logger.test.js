import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

let sendSlackError;

beforeEach(async () => {
  // Re-import each time since the module reads process.env inside the function
  const mod = await import('../../src/services/logger.service.js');
  sendSlackError = mod.sendSlackError;
});

describe('sendSlackError', () => {
  const mockReq = { method: 'POST', originalUrl: '/api/test' };

  afterEach(() => {
    delete process.env.SLACK_WEBHOOK_URL;
    delete global.fetch;
  });

  it('retorna sin hacer nada si SLACK_WEBHOOK_URL no está configurado', async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    await sendSlackError(new Error('test'), mockReq);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('envía notificación a Slack cuando SLACK_WEBHOOK_URL está configurado', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const err = new Error('Internal server error');
    err.statusCode = 500;
    err.stack = 'Error: Internal server error\n    at test.js:1:1';

    await sendSlackError(err, mockReq);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.any(String)
      })
    );
  });

  it('envía error sin statusCode (usa 500 por defecto)', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const err = new Error('Error sin statusCode');

    await sendSlackError(err, mockReq);
    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const statusField = body.attachments[0].fields.find(f => f.title === 'Status');
    expect(statusField.value).toBe('500');
  });

  it('envía error sin stack', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const err = { message: 'Error sin stack', statusCode: 500, stack: null };

    await sendSlackError(err, mockReq);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('maneja errores de fetch silenciosamente', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const err = new Error('App error');
    err.statusCode = 500;

    await expect(sendSlackError(err, mockReq)).resolves.not.toThrow();
  });
});
