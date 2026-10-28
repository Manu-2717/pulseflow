# USAR FOSS OIDC login

PulseFlow integrates with the OpenID Connect provider at `https://oidc.fossclub.tech`, implemented by [USAR-FOSS/OIDC](https://github.com/USAR-FOSS/OIDC).

## Configuration

Local settings live in the ignored `.env` file:

```dotenv
OIDC_ENABLED="false"
OIDC_ISSUER="https://oidc.fossclub.tech"
OIDC_CLIENT_ID="pulseflow"
OIDC_CLIENT_SECRET="shared confidential client secret"
```

The generated secret stays local. The provider administrator must install the **same value** as `CLIENT_SECRET_PULSEFLOW` in the OIDC service's production environment. Never put its value into `clients.json`, a pull request, an issue, or source control. PulseFlow's Vercel environment needs the corresponding settings too. Enable login only once the provider registration and its secret have been deployed. This provider intentionally does not support dynamic client registration; creating a PR does not activate the client by itself.

Registered callback URLs:

- `https://pulseflow-theta.vercel.app/api/auth/callback/fossclub`
- `http://localhost:3000/api/auth/callback/fossclub`

PulseFlow uses Better Auth 1.7's standard social-provider callback route, not the older `/oauth2/callback/` route. The login button is shown only when `OIDC_ENABLED=true` and valid credentials are configured.

## Identity and permissions

The integration uses the authorization-code flow, S256 PKCE, state and OIDC nonce binding, discovery JWKS, signed ID-token validation, issuer/audience checks, and `client_secret_basic`. It fails closed when discovery lacks verification metadata. It requests only `openid profile email`; club roles and GitHub identifiers are not needed. A provider's role or club membership never grants workspace or project privileges in PulseFlow. Accounts use the provider's stable `sub`, and new sessions require verified email.

Signing out ends the PulseFlow session. It does not sign the person out of every other club app. Existing Google and GitHub sign-in continue to work independently.

## Upstream registration

The requested `clients.json` registration is confidential, `trusted:true`, and `require_member:false`. Trusted status skips the provider's consent prompt after upstream review and deployment. Shared secret provisioning is still required on both services.
