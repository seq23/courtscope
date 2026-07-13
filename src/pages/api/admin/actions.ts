import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../lib/cloudflare-env';
import { ACTIONS, isActionId } from '../../../lib/admin/actions';
import { sameOrigin } from '../../../lib/admin/security';

interface ActionRequest {
  action?: string;
  confirmed?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Cross-origin admin requests are blocked.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ActionRequest;
  const action = String(body.action || '');
  if (!isActionId(action)) {
    return Response.json({ error: 'Action is not allowlisted.' }, { status: 400 });
  }

  const definition = ACTIONS[action];
  if (definition.confirm && !body.confirmed) {
    return Response.json({ error: 'Confirmation is required.' }, { status: 409 });
  }

  const env = getCloudflareEnv();
  if (!env.GITHUB_ADMIN_TOKEN || !env.GITHUB_REPOSITORY) {
    return Response.json(
      { error: 'GitHub admin credentials are not configured. No action was taken.' },
      { status: 503 },
    );
  }

  const receiptId = crypto.randomUUID();
  const inputs: Record<string, string> = { action, receipt_id: receiptId };
  if (action === 'cleanup_processed_data') {
    inputs.confirmation = 'DELETE_ELIGIBLE_PROCESSED_BATCHES';
  }

  const url = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/workflows/${definition.workflow}/dispatches`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.GITHUB_ADMIN_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'CourtScope-Admin',
    },
    body: JSON.stringify({ ref: 'main', inputs }),
  });

  if (!response.ok) {
    return Response.json(
      { error: `GitHub rejected the action (${response.status}). No success was recorded.` },
      { status: 502 },
    );
  }

  return Response.json(
    {
      message: `${action.replaceAll('_', ' ')} was dispatched. Completion is not claimed until the workflow receipt is available.`,
      workflow: definition.workflow,
      receipt_id: receiptId,
    },
    { status: 202 },
  );
};
