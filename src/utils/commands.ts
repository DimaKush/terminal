import { keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { history } from '../stores/history';
import { theme } from '../stores/theme';
import themes from '../../themes.json';

const getRandomTheme = () => {
  const currentTheme = JSON.parse(localStorage.getItem('colorscheme') || '{}');
  let newTheme;
  do {
    const randomIndex = Math.floor(Math.random() * themes.length);
    newTheme = themes[randomIndex];
  } while (newTheme.name === currentTheme.name);
  return newTheme;
};

const hostname = window.location.hostname;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const openProjectModal = (title: string, paragraphs: string[]) => {
  const id = 'project-about-modal';
  const prev = document.getElementById(id);
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:flex-start;justify-content:center;z-index:9999;padding:16px;overflow:auto;';

  const card = document.createElement('div');
  card.style.cssText =
    'max-width:680px;width:100%;max-height:calc(100dvh - 32px);overflow:auto;background:#111;color:#f5f5f5;border:1px solid #333;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.45);font-family:inherit;font-size:clamp(13px,3.4vw,16px);margin:auto 0;';

  const content = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px 0;line-height:1.55;">${escapeHtml(paragraph)}</p>`,
    )
    .join('');

  card.innerHTML = `<h3 style="margin:0 0 12px 0;font-size:18px;">${escapeHtml(title)}</h3>${content}<div style="display:flex;justify-content:flex-end;"><button type="button" style="padding:8px 12px;background:#1f1f1f;color:#f5f5f5;border:1px solid #3a3a3a;border-radius:8px;cursor:pointer;">Close</button></div>`;

  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  card.querySelector('button')?.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
};

const openAlexaAiModal = () =>
  openProjectModal('Alexa AI Bot', [
    'Telegram-native AI generation product with a payment-first user flow: request -> checkout -> delivery.',
    'Backend orchestrates provider calls through async workers, enforces idempotent webhook/payment handling, and persists user/order state in PostgreSQL with Redis-backed queues and caching.',
  ]);

const openGeneriProModal = () =>
  openProjectModal('Freebanana.online', [
    'Multi-surface AI platform (Telegram bot + Mini App + API) that unifies authentication, balance/payments, and generation workflows across clients.',
    'FastAPI validates Telegram initData, issues JWT-scoped sessions, and serves shared domain services for both bot and web surfaces, with PostgreSQL + Redis event-driven processing for reliable async execution and retries.',
  ]);

const openVpNextModal = () =>
  openProjectModal('vp-next', [
    'Telegram VPN bot: /start performs telegramId-bound user/profile upsert; users request access via “Купить”, pay with Telegram Stars invoices, and on message:successful_payment get VLESS/Shadowsocks links plus an optional subscription URL as subscriptions activate or extend.',
    'TypeScript/Node.js with grammY, Drizzle ORM, and PostgreSQL—bot handlers, payment/subscription services, and a config pipeline that compiles per-node Xray Reality+SS configs from active subscriptions and profile keys.',
    'Reliability: payment idempotency on telegramPaymentChargeId, pre-checkout payload validation, conflict-safe user creation (onConflictDoUpdate), deterministic re-runnable push/deploy jobs, daily cron reconciliation to revoke expired access and refresh node configs, systemd Restart=always in production.',
  ]);

const openAutozillaModal = () =>
  openProjectModal('Autozilla', [
    'Autozilla (https://autozilla.pro, bot: https://t.me/Autozilla_bot) is a production Telegram-first vehicle workflow where user identity is anchored by Telegram auth, the core action is auction-sheet parsing/translation plus catalog filtering, payment runs through Tochka SBP QR, and the result is immediate balance mutation in auction_access with delivered translation artifacts (PDF/photo) from S3-backed storage.',
    'The architecture is split into Next.js 15 + React 18 (TypeScript) for web surfaces, an aiogram/aiohttp Python bot for command/state handling, and MySQL for transactional state; parsers run as isolated services in Docker Compose and feed the same data plane for unified user/payment history.',
    'Reliability is handled with webhook-driven payment confirmation (JWT-verified bank callbacks), duplicate-safe payment lifecycle controls (active-payment reuse, unique payment IDs, status-gated processing), and explicit retry logic with exponential backoff around external AI/Telegram operations so transient failures do not break the payment-to-credit pipeline.',
  ]);

const openWhitecubeModal = () =>
  openProjectModal('WhiteCube', [
    'WhiteCube is a static single-page marketing site for AM BK (envelope work: otmostki, facades, roofs, turnkey from survey to handoff), structured as a linear content flow from specialization and an eight-step full-cycle outline to specification callouts.',
    'The page deep-links to official standards texts: SP 82.13330.2016 (https://docs.cntd.ru/document/456054208), SP 522.1325800.2023 (https://docs.cntd.ru/document/1301712975), and SP 17.13330.2017 (https://docs.cntd.ru/document/456081632), then drives conversion to WhatsApp at https://wa.me/+79146886226 and footer email.',
    'Implementation is pure HTML/CSS/vanilla JS with a requestAnimationFrame carousel (prev/next + touch swipe), SVG/raster assets, local @font-face GOST 2304 Type A in styles.css, Yandex site verification in head, and crawl-open robots.txt; there is no auth, payment capture, server API, frontend framework, or build pipeline in this tree.',
  ]);

const openPlantarModal = () =>
  openProjectModal('Plantar', [
    'Plantar (https://plantar.fun) is a production MVP web app with Telegram Mini App auth parity where users authenticate via email/OAuth or signed Telegram initData (HMAC-validated), create/offer plants, negotiate in exchange-bound chat, and settle the payment leg through an internal ROOTS→LEAFS reward ledger on confirmed exchange completion.',
    'The platform records auditable state transitions (requested -> accepted -> confirmed -> completed) and balance updates. Architecture: React + Vite + TypeScript frontend (TanStack Query, Zustand) over FastAPI + SQLAlchemy backend with PostgreSQL/SQLite support, Redis in the stack, strict CORS/TrustedHost/CSP/rate-limiting middleware, plus domain services for auth, exchange, rewards, referrals, moderation, and Telegram integration.',
    'Reliability is enforced via idempotent room creation semantics (get_or_create with unique exchange_id), guarded transition checks preventing double-active exchanges, unique/transactional persistence patterns (reward records and token tx uniqueness), and startup/runtime hardening through env validation and health endpoints; external PSP/webhook/queue rails are intentionally deferred while core API/DB consistency is already enforced.',
  ]);

const openWishGranterModal = () =>
  openProjectModal('WGranter (Wish Granter)', [
    'WGranter is a Telegram-first MVP where auth is handled by Telegram identity (with SIWE/allowlist config hooks in place), the core action is a Telegraf text dialogue with persisted per-user context, and the result is a cleaned assistant response plus deterministic side effects (wish/superwish detection and optional channel invite at https://t.me/+ZYiVyJfXCJA2NTgy).',
    'Project context and docs are public at https://github.com/DimaKush/wish_granter. Backend is TypeScript on Node.js with Telegraf + custom middleware, a direct Anthropic Messages API client (Claude 3.7 Sonnet) with bounded exponential retries on transient HTTP/network faults, encrypted local chat-history storage (AES-256-CBC), and explicit graceful-degradation paths for overload/invalid-key/runtime failures.',
    'Reliability includes per-user throttling, retryable-call classification, isolated history files, and structured Winston logs; payment/webhook/queue rails are intentionally out of current scope to keep auth -> action -> AI result tight for production-like bot operation without premature billing orchestration.',
  ]);

const openIndonesianFlashcardModal = () =>
  openProjectModal('Indonesian Flashcard', [
    'Indonesian Flashcard (web app at https://indonesianflashcard.vercel.app, project link https://github.com/DimaKush/thaiflashcard) runs a strict flow of Google OAuth via NextAuth JWT sessions -> user image upload/crop action -> AI processing pipeline -> persisted flashcard result with Indonesian text, translation, and generated audio.',
    'The payment step is intentionally isolated and currently not active in MVP, with a dedicated enterprise-service boundary prepared for Stripe checkout/webhook integration without coupling it to the learning flow. Architecture combines a production Next.js + TypeScript app (server actions for OCR/object detection/Claude description + TTS orchestration) with a parallel event-driven microservices track (API Gateway, Event Bus, User, Flashcard, Translation, TTS services) to separate synchronous UX-critical work from async domain events and keep migration paths open.',
    'Reliability is handled through provider fallback chains, exponential retries, 24h content-addressed caching (NodeCache/Redis), correlation-id event tracing and PostgreSQL-backed event store streams (Redis Pub/Sub + Postgres), while core app data persists in MySQL and media/audio artifacts are stored in Google Cloud Storage.',
  ]);

const openPezdotaModal = () =>
  openProjectModal('PEZDOTA', [
    'PEZDOTA (https://pezdota.fun, Telegram: https://t.me/pezdotafun, support/bot entry: https://t.me/pezdoter) implements a strict onchain flow: wallet auth via RainbowKit/Wagmi -> match creation or bet intent in Next.js 15 -> ETH settlement through Prediction contract methods (createMatch, betTeam1/2, claim) -> deterministic resolution/refund via resolver or communityResolve, with final state surfaced in UI and Telegram updates.',
    'The architecture is split between an EVM core (Solidity + Foundry), a typed App Router frontend using Scaffold-ETH hooks (useScaffoldReadContract/useScaffoldWriteContract), and Node workers (eventListener.js, autoBetService.js) that consume contract events, enrich data from Steam/OpenDota, and persist operational state in better-sqlite3 for replay-safe processing.',
    'Reliability is handled with practical idempotency and recovery controls: per-match dedupe (processedMatches), DB primary keys + INSERT OR REPLACE for exactly-once-ish side effects, exponential backoff/retries for RPC/Steam/Telegram paths, bounded batching/rate limiting to avoid provider throttling, tx-receipt waits for confirmation, and event-driven push delivery instead of fragile external webhooks.',
  ]);

const openSiweSignerModal = () =>
  openProjectModal('SIWE Message Signer', [
    'SIWE Message Signer (Website: N/A, App: https://github.com/DimaKush/siwe-svelte) is a SvelteKit web app where the flow is wallet auth (eth_requestAccounts) -> SIWE payload validation/parsing -> EIP-4361 signature via ethers -> deterministic hash/result output, with no payment leg in the current product scope.',
    'The architecture is intentionally client-heavy (Svelte 5 + SvelteKit + ethers v6 + siwe), validating domain/address/chainId/URI/issuedAt before signing and hard-failing on signer/message address mismatch to prevent invalid auth artifacts.',
    'Reliability is handled through deterministic/idempotent transforms (hashMessage on canonical input), explicit rejection/error-code handling for wallet actions, and a backend-free surface area (so no queues/webhooks/retry workers to drift out of sync), with optional static build distribution including IPFS deployment for immutable artifact hosting.',
  ]);

const openWillerModal = () =>
  openProjectModal('Willer', [
    'Willer (https://willer-eth.vercel.app, https://t.me/willer_eth) is a production Web3 app where users authenticate with SIWE via NextAuth, configure a will (beneficiaries, weighted shares, ERC721 beneficiary, release timestamp), and execute settlement from /[testatorAddress] once the timelock expires.',
    'The payment leg is fully on-chain (wallet-signed token transfers plus gas, no off-chain processor): ERC20/ERC1155 are split pro-rata, ERC721 is routed to a dedicated heir, and final remainder handling is deterministic for rounding edge cases.',
    'Architecture is intentionally minimal and trust-reduced—Next.js + TypeScript + Chakra UI + wagmi/RainbowKit on the client, Solidity 0.8.21 with OpenZeppelin SafeERC20 in the core contract, no owner/no upgrade path, and reliability enforced on-chain through strict validation guards, release-time gating, allowance checks, custom errors, and a reentrancy lock instead of queue/webhook retry infrastructure.',
  ]);

const openAltarModal = () =>
  openProjectModal('Altar', [
    'Altar (https://blesed.eth.limo) is an Ethereum dApp where authentication is wallet-based (EOA signing), the user executes a single spark action by sending ETH, payment and state transition settle atomically on-chain, and the result is a personalized BLES ERC20 plus TORCH allocation with optional Uniswap V2 LP creation and a 10,000-day Sablier V2 lock.',
    'The architecture is intentionally contract-first and non-custodial: a main Altar contract orchestrates BLES minting, protocol fee split, TORCH distribution, Uniswap pair provisioning, and LP stream locking, while the frontend stack uses React + TypeScript + ethers.js and the contract stack is Solidity with Foundry-based testing.',
    'Reliability is enforced at protocol level via once() (per-address idempotency), lock() (reentrancy protection), strict range checks and fail-fast balance guards for TORCH/ETH transfers, plus immutable non-upgradeable contracts with no admin backdoors, so there are no off-chain retries/queues/webhook dependencies in the critical path.',
    'For production visibility, the deployed core is publicly verifiable at https://etherscan.io/address/0x5d36d947ec045ef3e1143a9c57658d8dc1103a6d#code and https://etherscan.io/address/0x954101BE56Ce707aA513b34d091e10424F8944ea#code.',
  ]);

const openAiaModal = () =>
  openProjectModal('AIA', [
    'AIA (bot: https://t.me/Aia_iai_bot, website: N/A) is a production Telegram bot where the runtime flow is explicit: user authenticates through /start + channel-gate checks, submits a generation/chat action (image remix, video, LoRA, or text), passes payment via Telegram Stars (and optional YooKassa webhook path), and receives the generated media/result with persisted state.',
    'The backend is Python aiogram in webhook mode over aiohttp, with PostgreSQL (asyncpg) for durable user/payment/session data, Redis for FSM state, payment claims, and rate/short-lived workflow keys, and S3-compatible object storage for media artifacts; AI execution is routed across OpenAI, Google Gemini, Replicate, and Anthropic providers.',
    'Reliability is handled with idempotent payment guards (SETNX-style claim keys for payment/charge IDs), atomic balance/payment handling in DB, asynchronous background task execution with queue-oriented boundaries (current asyncio task workers and Celery-ready migration path), provider polling controls/timeouts, and webhook-based event ingestion so payment and generation side effects stay replay-safe under retries or duplicate delivery.',
  ]);

const openSportsAlmanacModal = () =>
  openProjectModal('SportsAlmanac', [
    'SportsAlmanac (https://t.me/SportsAlmanacbot?start=_tgr_VxmzTac5Mjhi) is a Telegram prediction product where auth is native Telegram identity (/start upserts user state), the core action is sport/league/match selection and AI prediction request, payment is Telegram Stars invoice settlement, and result delivery is immediate prediction rendering plus history write and channel publication dedupe.',
    'The backend is Python aiogram with DI-scoped services (PredictionService, VangaDatabase, AnthropicClient), Anthropic Claude (claude-3-7-sonnet-latest with web_search tool) for generation, API-Sports feeds for fixtures/odds context, and a normalized V2 data model persisted in SQLite (WAL mode) with MySQL-style upsert compatibility.',
    'Reliability is implemented with payment and content idempotency (invoice_payload replay checks, ON DUPLICATE KEY/conflict upserts, publish-once guard in channel_publications), race-condition rechecks before prediction writes, explicit payment state machine (pending/completed/failed/cancelled), automatic Stars refunds on generation/save failures, and webhook-capable runtime for production delivery while keeping polling fallback for local operation.',
  ]);

const openThaiFlashcardModal = () =>
  openProjectModal('Thai Flashcard', [
    'Thai Flashcard (https://thaiflashcard.vercel.app) is the same product as Indonesian Flashcard, repointed to Thai vocabulary and content—clone deployment, different language dataset and branding.',
    'Architecture, auth flow, AI pipeline, and reliability story match Indonesian Flashcard; see the Indonesian Flashcard [about] for the full technical write-up.',
  ]);

const openConvinceMeModal = () =>
  openProjectModal('ConvinceMeAI', [
    'ConvinceMeAI is an AI debate game where users pick a historical persona, defend a thesis in live dialogue, and try to shift the opponent’s hidden conviction meter before running out of turns.',
    'Each round combines a judge model that scores persuasion delta with a character model that roleplays in persona, creating strategic back-and-forth instead of generic chatbot Q&A.',
    'The app supports EN/RU localization, paid Pro + credit packs for deeper play, and UGC thesis submissions with moderation so content can expand from real player input.',
  ]);

const openContractoorModal = () =>
  openProjectModal('Contractoor', [
    'Contractoor (https://contractoor.org) is a production web app for freelancers and small businesses in CIS: upload a PDF/DOCX contract, get Claude-powered risk analysis (scored clauses, red flags) plus section-aware translation across EN/RU/KZ/UZ/ID, with Google/Yandex/Telegram auth and per-user free-tier limits before Pro.',
    'Architecture: React 18 + Vite + TypeScript + Tailwind SPA over FastAPI + SQLAlchemy async + PostgreSQL; PyMuPDF/python-docx ingestion, dedicated analyzer/translation/revision Claude prompts, persisted analysis history, and a sworn-translation intake funnel (file upload, language pair, delivery contact) that notifies ops via Telegram while quotes/settlement stay manual off-platform.',
    'Reliability is enforced with slowapi IP rate limits, authenticated quota checks on analyze/translate routes, structured JSON contract outputs with validation fallbacks, sanitized user text for notifications, and idempotent sworn request persistence with upload storage—billing webhooks are intentionally deferred so the core upload -> AI result -> sworn lead path stays consistent.',
  ]);

const openPrimfasadModal = () =>
  openProjectModal('Primfasad', [
    'Primfasad (https://primfasad.com, bot: https://t.me/primfasad_bot) is a production Primorsky-focused facade service: users upload a house photo, run AI facade visualization (style presets + textures + variants), then convert to a free on-site design/measurement lead and turnkey install funnel—web, Telegram Mini App, and bot /start → WebApp entry share the same product surface.',
    'Architecture: React + Vite + TypeScript SPA (SEO/blog CMS, estimates, materials catalog, admin) over FastAPI + async PostgreSQL, with a thin aiogram/aiohttp bot for webhooks (Telegram, YooKassa, lead intake to admins), Redis for sessions/rate keys, JWT from Telegram initData plus Google/Yandex OAuth, token billing via YooKassa, and background facade generation jobs with WebSocket progress.',
    'Reliability: atomic YooKassa webhook processing (status-gated, amount/metadata validation), generation batch rollback on failure, API rate limiting + admin audit middleware, conflict-safe user upserts, and Docker Compose production stack (postgres, redis, bot, api, webapp) with shared env and health endpoints.',
  ]);

(
  window as Window & {
    openAlexaAiModal?: () => void;
    openGeneriProModal?: () => void;
    openVpNextModal?: () => void;
    openAutozillaModal?: () => void;
    openWhitecubeModal?: () => void;
    openPlantarModal?: () => void;
    openWishGranterModal?: () => void;
    openIndonesianFlashcardModal?: () => void;
    openPezdotaModal?: () => void;
    openSiweSignerModal?: () => void;
    openWillerModal?: () => void;
    openAltarModal?: () => void;
    openAiaModal?: () => void;
    openSportsAlmanacModal?: () => void;
    openThaiFlashcardModal?: () => void;
    openConvinceMeModal?: () => void;
    openContractoorModal?: () => void;
    openPrimfasadModal?: () => void;
  }
).openAlexaAiModal = openAlexaAiModal;
(window as Window & { openGeneriProModal?: () => void }).openGeneriProModal =
  openGeneriProModal;
(window as Window & { openVpNextModal?: () => void }).openVpNextModal =
  openVpNextModal;
(window as Window & { openAutozillaModal?: () => void }).openAutozillaModal =
  openAutozillaModal;
(window as Window & { openWhitecubeModal?: () => void }).openWhitecubeModal =
  openWhitecubeModal;
(window as Window & { openPlantarModal?: () => void }).openPlantarModal =
  openPlantarModal;
(window as Window & { openWishGranterModal?: () => void }).openWishGranterModal =
  openWishGranterModal;
(window as Window & { openIndonesianFlashcardModal?: () => void }).openIndonesianFlashcardModal =
  openIndonesianFlashcardModal;
(window as Window & { openPezdotaModal?: () => void }).openPezdotaModal =
  openPezdotaModal;
(window as Window & { openSiweSignerModal?: () => void }).openSiweSignerModal =
  openSiweSignerModal;
(window as Window & { openWillerModal?: () => void }).openWillerModal =
  openWillerModal;
(window as Window & { openAltarModal?: () => void }).openAltarModal =
  openAltarModal;
(window as Window & { openAiaModal?: () => void }).openAiaModal = openAiaModal;
(window as Window & { openSportsAlmanacModal?: () => void }).openSportsAlmanacModal =
  openSportsAlmanacModal;
(window as Window & { openThaiFlashcardModal?: () => void }).openThaiFlashcardModal =
  openThaiFlashcardModal;
(window as Window & { openConvinceMeModal?: () => void }).openConvinceMeModal =
  openConvinceMeModal;
(window as Window & { openContractoorModal?: () => void }).openContractoorModal =
  openContractoorModal;
(window as Window & { openPrimfasadModal?: () => void }).openPrimfasadModal =
  openPrimfasadModal;

export const commands: Record<string, (args: string[]) => Promise<string> | string> = {
  help: () => 'Available commands: ' + Object.keys(commands).join(', '),
  hostname: () => hostname,
  whoami: () => 'U decide',
  clear: () => {
    history.set([]);

    return '';
  },
  email: () => {
    window.open(`mailto:dimakush@protonmail.com`);

    return `Opening mailto:dimakush@protonmail.com...`;
  },
  theme: () => {
    const newTheme = getRandomTheme();
    localStorage.setItem('colorscheme', JSON.stringify(newTheme));
    theme.set(newTheme);
    return `Theme changed to ${newTheme.name}`;
  },
  weather: async (args: string[]) => {
    const city = args.join('+');

    if (!city) {
      return 'Usage: weather [city]. Example: weather Brussels';
    }

    const weather = await fetch(`https://wttr.in/${city}?AT0Fq`);

    return weather.text();
  },
  ip: async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return `Your public IP address is: ${data.ip}`;
    } catch (error) {
      return 'Failed to fetch IP address';
    }
  },
  // img: () => {
  //   window.open('https://bafybeicoveblrk4g7kyziqmbt5ljbn7hmdscvehhsrdtgq6mdleti2464q.ipfs.dweb.link?filename=IMG.jpg', '_blank');
  //   return 'Opening image...';
  // },
  keccak: (args: string[]) => {
    if (!args.length) return 'Usage: keccak [data]';
    try {
      const input = args.join(' ');
      // viem keccak256 expects bytes, so encode as utf-8
      const hash = keccak256(toBytes(input));
      return hash;
    } catch (e) {
      return 'Error: ' + (e instanceof Error ? e.message : String(e));
    }
  },
  wallet: (args: string[]) => {
    if (!args.length) return 'Usage: wallet [private_key]';
    try {
      let pk = args.join('').replace(/\s/g, '');
      if (!pk.startsWith('0x')) {
        pk = '0x' + pk;
      }
      const account = privateKeyToAccount(pk as `0x${string}`);
      const addr = account.address;
      const href = `https://etherscan.io/address/${addr}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(addr)}</a>`;
    } catch (e) {
      return 'Error: ' + (e instanceof Error ? e.message : String(e));
    }
  },
  who: () => `
██████╗ ██╗███╗   ███╗ █████╗    
██╔══██╗██║████╗ ████║██╔══██╗   
██║  ██║██║██╔████╔██║███████║   
██║  ██║██║██║╚██╔╝██║██╔══██║   
██████╔╝██║██║ ╚═╝ ██║██║  ██║   
╚═════╝ ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝
██╗  ██╗██╗   ██╗███████╗██╗  ██╗
██║ ██╔╝██║   ██║██╔════╝██║  ██║
█████╔╝ ██║   ██║███████╗███████║
██╔═██╗ ██║   ██║╚════██║██╔══██║
██║  ██╗╚██████╔╝███████║██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
another one dev

Github: <a href="https://github.com/DimaKush" target="_blank" rel="noopener noreferrer">https://github.com/DimaKush</a>
Twitter: <a href="https://x.com/_Dima_Kush_" target="_blank" rel="noopener noreferrer">https://x.com/_Dima_Kush_</a>
Discord: <a href="https://discordapp.com/users/761573894065881089" target="_blank" rel="noopener noreferrer">https://discordapp.com/users/761573894065881089</a>
Telegram: <a href="https://t.me/kushnarevdn" target="_blank" rel="noopener noreferrer">https://t.me/kushnarevdn</a>

Projects:
<a href="https://altar.dimakush.dev/" target="_blank" rel="noopener noreferrer">Altar - onchain giving economy platform</a> <a href="#" onclick="window.openAltarModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://siwe.dimakush.eth.limo/" target="_blank" rel="noopener noreferrer">SIWE Signer</a> <a href="#" onclick="window.openSiweSignerModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://willer-eth.vercel.app/" target="_blank" rel="noopener noreferrer">Willer - onchain testamentary notary</a> <a href="#" onclick="window.openWillerModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://indonesianflashcard.vercel.app/" target="_blank" rel="noopener noreferrer">Indonesian Flash Card</a> <a href="#" onclick="window.openIndonesianFlashcardModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://autozilla.pro/" target="_blank" rel="noopener noreferrer">Autozilla.pro</a> + <a href="https://t.me/Autozilla_bot" target="_blank" rel="noopener noreferrer">Autozilla Bot</a> <a href="#" onclick="window.openAutozillaModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://t.me/Aia_iai_bot?start=_tgr_JncWzf9hMjBi" target="_blank" rel="noopener noreferrer">AIA image and video generation </a> <a href="#" onclick="window.openAiaModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://t.me/wgranter_bot" target="_blank" rel="noopener noreferrer">Wish Granter</a> <a href="#" onclick="window.openWishGranterModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://plantar.fun/register?ref=ref399YXPNOXS7WZY04" target="_blank" rel="noopener noreferrer">Plantar - plant exchange platform</a> <a href="#" onclick="window.openPlantarModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://pezdota.fun" target="_blank" rel="noopener noreferrer">DotA2 prediction markets</a> <a href="#" onclick="window.openPezdotaModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://t.me/SportsAlmanacbot?start=_tgr_VxmzTac5Mjhi" target="_blank" rel="noopener noreferrer">SportsAlmanac - sports predictions</a> <a href="#" onclick="window.openSportsAlmanacModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://thaiflashcard.vercel.app/" target="_blank" rel="noopener noreferrer">Thai Flash Card</a> <a href="#" onclick="window.openThaiFlashcardModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://whitecube.space/" target="_blank" rel="noopener noreferrer">WhiteCube - Engineering Company</a> <a href="#" onclick="window.openWhitecubeModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://t.me/alexa_ai_official_bot/" target="_blank" rel="noopener noreferrer">Alexa AI - image and video generation</a> <a href="#" onclick="window.openAlexaAiModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://freebanana.online" target="_blank" rel="noopener noreferrer">freebanana.online</a> + <a href="https://t.me/free_banana_online_bot" target="_blank" rel="noopener noreferrer">Freebanana Bot</a> <a href="#" onclick="window.openGeneriProModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://t.me/vp_next_bot" target="_blank" rel="noopener noreferrer">vp-next — Telegram VPN bot (Telegram Stars, Xray configs)</a> <a href="#" onclick="window.openVpNextModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://ConvinceMe.fun" target="_blank" rel="noopener noreferrer">ConvinceMeAI</a> <a href="#" onclick="window.openConvinceMeModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://contractoor.org/" target="_blank" rel="noopener noreferrer">Contractoor — AI contract risk analysis + translation</a> <a href="#" onclick="window.openContractoorModal(); return false;" rel="noopener noreferrer">[about]</a>
<a href="https://primfasad.com/" target="_blank" rel="noopener noreferrer">Primfasad — AI facade visualization + turnkey install (Primorye)</a> + <a href="https://t.me/primfasad_bot" target="_blank" rel="noopener noreferrer">Bot</a> <a href="#" onclick="window.openPrimfasadModal(); return false;" rel="noopener noreferrer">[about]</a>

Background:
• Since 2020: Living and working remotely across Southeast Asia
• Since 2022: Building web3 projects and providing psychological counseling
• 2017-2019: Self-employed at Printing Company
• 2015-2018: Design Engineer at Alpha Engineering
• 2012-2015: Design Engineer at Amira LLC
• 2012: Design Engineer at Dalzavod LLC
• 2011-2012: Welder at Stroy-Personal
• 2011: Graduated from FEFU as Marine Engineer

Type 'help' to see the list of available commands.
`,
};
