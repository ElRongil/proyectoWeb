const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const sendSlackError = async (err, req) => {
  if (!SLACK_WEBHOOK_URL) return;

  const payload = {
    text: '🚨 *Error 5XX en BildyApp*',
    attachments: [
      {
        color: 'danger',
        fields: [
          { title: 'Timestamp', value: new Date().toISOString(), short: true },
          { title: 'Método', value: req.method, short: true },
          { title: 'Ruta', value: req.originalUrl, short: true },
          { title: 'Status', value: String(err.statusCode || 500), short: true },
          { title: 'Error', value: err.message || 'Sin mensaje' },
          ...(err.stack
            ? [{ title: 'Stack', value: `\`\`\`${err.stack.slice(0, 1000)}\`\`\`` }]
            : [])
        ]
      }
    ]
  };

  fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
};
