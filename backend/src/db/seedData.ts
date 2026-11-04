export interface SeedCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface SeedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category_id: number;
  author_id: number;
  status: 'published' | 'draft';
  reading_time: number;
  views: number;
  shares: number;
  published_at: string;
  tags: string[];
}

export const initialCategories: SeedCategory[] = [
  {
    id: 1,
    name: "Bitcoin & Blockchain",
    slug: "bitcoin-blockchain",
    description: "Foundational principles of distributed ledgers, cryptographic proofs, and sovereign monetary systems."
  },
  {
    id: 2,
    name: "Ethereum & Smart Contracts",
    slug: "ethereum-smart-contracts",
    description: "Programmable blockchains, the Ethereum Virtual Machine (EVM), and decentralized applications."
  },
  {
    id: 3,
    name: "DeFi & Yield",
    slug: "defi-yield",
    description: "Decentralized finance protocols, automated market makers, lending markets, and liquidity pools."
  },
  {
    id: 4,
    name: "Security & Wallets",
    slug: "security-wallets",
    description: "Self-custody best practices, hardware wallets, multisig security, and defending against Web3 scams."
  }
];

export const initialPosts: SeedPost[] = [
  {
    id: 1,
    title: "Bitcoin Basics: How Satoshi Nakamoto Solved the Double-Spend Problem",
    slug: "bitcoin-basics-how-satoshi-solved-double-spend",
    excerpt: "Discover the cryptographic breakthrough of Proof of Work and how Bitcoin established trust without central intermediaries.",
    cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    category_id: 1,
    author_id: 1,
    status: "published",
    reading_time: 6,
    views: 0,
    shares: 0,
    published_at: "2026-10-15 10:00:00",
    tags: ["Bitcoin", "Cryptography", "Proof of Work"],
    content: `
# Bitcoin Basics: The Double-Spend Problem Solved

In October 2008, an anonymous cryptographer operating under the pseudonym **Satoshi Nakamoto** published a nine-page whitepaper entitled *Bitcoin: A Peer-to-Peer Electronic Cash System*. It addressed a computational challenge that had stymied computer scientists for three decades: **The Double-Spend Problem**.

---

## 1. What is the Double-Spend Problem?
In the physical world, cash possesses an innate constraint: if you hand a physical \$20 banknote to a barista, you no longer possess it. Digital information, however, consists of bits—infinitely replicable sequences of ones and zeros. Without an intermediary bank to reconcile ledger balances, Alice could theoretically transmit the same digital dollar simultaneously to Bob and Charlie.

Traditional systems solved this by placing a centralized ledger authority (like a central bank, Visa, or PayPal) in the middle. But centralized authorities introduce single points of failure, censorship risks, and rent-seeking friction.

---

## 2. Satoshi's Trifecta of Breakthroughs
Bitcoin solved double-spending through a combination of three existing computer science concepts orchestrated in a novel manner:

1. **Cryptographic Hashing (SHA-256):** Transactions are bundled into blocks. Each block references the cryptographic hash of the previous block, creating an immutable chronological chain.
2. **Proof-of-Work (PoW):** Miners expend thermodynamic energy finding nonce values that satisfy difficulty requirements. Reversing or modifying a historical block requires recapturing more hash power than the combined honest network.
3. **The Longest Chain Rule (Nakamoto Consensus):** When nodes encounter competing versions of ledger history, they always adopt the chain backed by the greatest cumulative proof of work.

\`\`\`
[Block #840,000] <-- [Block #840,001] <-- [Block #840,002]
Prev Hash: 000...    Prev Hash: 000...    Prev Hash: 000...
Nonce: 3,921,847     Nonce: 1,294,008     Nonce: 8,491,203
\`\`\`

---

## 3. The Unspent Transaction Output (UTXO) Model
Unlike traditional bank balances that function like an account ledger, Bitcoin operates via **UTXOs (Unspent Transaction Outputs)**. Every transaction consumes existing UTXOs as inputs and generates new UTXOs as outputs. 

> "Proof-of-work is essentially one-CPU-one-vote. The majority decision is represented by the longest chain, which has the greatest proof-of-work effort invested in it." — Satoshi Nakamoto

---

## Key Takeaways
- Bitcoin replaced institutional trust with mathematical and thermodynamic proof.
- Immutability increases exponentially as more blocks are appended on top of transactions.
- True financial sovereignty requires verifying transactions independently via a full node.
    `.trim()
  },
  {
    id: 2,
    title: "Ethereum Explained: The World Computer & Smart Contracts",
    slug: "ethereum-explained-world-computer-smart-contracts",
    excerpt: "Explore how Vitalik Buterin expanded blockchain beyond digital money into a global, Turing-complete decentralized compute layer.",
    cover_image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=1200&q=80",
    category_id: 2,
    author_id: 1,
    status: "published",
    reading_time: 8,
    views: 0,
    shares: 0,
    published_at: "2026-10-18 12:30:00",
    tags: ["Ethereum", "Smart Contracts", "EVM"],
    content: `
# Ethereum Explained: The World Computer

If Bitcoin is digital gold, **Ethereum is the digital power grid**. Proposed by 19-year-old Vitalik Buterin in late 2013, Ethereum was conceived as a generalized platform where developers could program arbitrary state transitions directly onto a trustless distributed network.

---

## 1. What are Smart Contracts?
Nick Szabo coined the term "smart contract" in the 1990s, famously comparing it to a **vending machine**:

> You insert coins, select a snack, and hardware gates dispense your item automatically. No shopkeeper, no negotiation, no trust required.

On Ethereum, a smart contract is a computer program deployed to the blockchain that executes deterministically when triggered by transactions. Once deployed, its code is immutable and verified by thousands of nodes worldwide.

---

## 2. The Ethereum Virtual Machine (EVM)
At the core of Ethereum is the **EVM (Ethereum Virtual Machine)**—a decentralized virtual computing environment embedded within every full node.

Key components of the EVM:
- **Turing-Completeness:** Can execute any algorithmic logic (loops, recursions, conditionals), subject to computational gas limits.
- **Gas Mechanism:** Every computational opcode consumes a fee in Gwei (billionths of an ETH). This prevents infinite loops, denial-of-service exploits, and prioritizes block space efficiently.
- **State Trie Architecture:** Ethereum maintains an account state database (balances, contract storage, code hashes) updated per block.

\`\`\`solidity
// Sample EVM Escrow Contract
contract SafeEscrow {
    address public buyer;
    address payable public seller;
    uint public value;

    function confirmPurchase() external payable {
        buyer = msg.sender;
        value = msg.value;
    }

    function completeDelivery() external {
        require(msg.sender == buyer, "Only buyer can verify delivery");
        seller.transfer(value);
    }
}
\`\`\`

---

## 3. Proof of Stake & The Merge
In September 2022, Ethereum completed **The Merge**, replacing Proof of Work with **Proof of Stake (PoS)**. Validators stake 32 ETH as collateral to propose and attest to blocks, cutting network energy consumption by over 99.9% while introducing programmatic slashing penalties for malicious behavior.

---

## Summary
Ethereum unlocked decentralized applications (dApps), non-fungible tokens (NFTs), decentralized finance (DeFi), and autonomous organizations (DAOs). It transformed the blockchain from a passive monetary ledger into an active global computing engine.
    `.trim()
  },
  {
    id: 3,
    title: "DeFi 101: Understanding Automated Market Makers (AMMs) & Liquidity Pools",
    slug: "defi-101-automated-market-makers-liquidity-pools",
    excerpt: "Learn how decentralized exchanges like Uniswap replace traditional order books with liquidity pools governed by mathematical formulas.",
    cover_image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    category_id: 3,
    author_id: 1,
    status: "published",
    reading_time: 7,
    views: 0,
    shares: 0,
    published_at: "2026-10-22 09:00:00",
    tags: ["DeFi", "Uniswap", "AMMs"],
    content: `
# DeFi 101: Understanding AMMs & Liquidity Pools

Traditional financial exchanges (such as NASDAQ or the New York Stock Exchange) rely on **Central Limit Order Books (CLOBs)**. Market makers post bid and ask quotes, and matching engines execute trades when orders cross.

On high-latency, gas-constrained blockchains, maintaining active order books was historically unfeasible. The breakthrough came with **Automated Market Makers (AMMs)**.

---

## 1. The Constant Product Formula: x * y = k
Pioneered by Uniswap, the constant product formula allows autonomous decentralized exchanges without human market makers:

$$\\mathbf{x \\times y = k}$$

Where:
- **x** = Reserve balance of Token A in the pool (e.g. ETH)
- **y** = Reserve balance of Token B in the pool (e.g. USDC)
- **k** = Constant invariant that must remain constant throughout swaps (excluding transaction fees)

### How a Swap Works:
When a trader deposits $\\Delta x$ Token A into the pool to purchase Token B, the pool must return $\\Delta y$ Token B such that:

$$(x + \\Delta x) \\times (y - \\Delta y) = k$$

The relative price of the tokens adjusts dynamically based on the ratio between $x$ and $y$. Larger trades relative to pool depth experience **price slippage**.

---

## 2. Liquidity Providers (LPs)
Anyone can deposit equal economic values of Token A and Token B into a smart contract pool. In return, the LP receives:
- **LP Tokens** representing their proportional share of total liquidity.
- A share of all swap fees (typically 0.05% to 0.30%) collected by the pool.

---

## 3. Impermanent Loss Explained
When market prices diverge from the ratio at which you supplied liquidity, arbitrageurs rebalance the pool. If you withdraw your assets after a significant price swing, your total portfolio value may be less than if you simply held the tokens outside the pool. This variance is termed **Impermanent Loss (IL)**.

---

## Key Benefits of AMMs
- **Permissionless:** Anyone can create a market for any token pair.
- **Continuous Liquidity:** Trades can execute at any time, even for low-cap assets.
- **Composability:** Smart contracts can interact with AMMs as "money Legos" to build complex financial products.
    `.trim()
  },
  {
    id: 4,
    title: "Crypto Wallet Security: Hardware Wallets, Seed Phrases & Air-Gapped Custody",
    slug: "crypto-wallet-security-hardware-wallets-seed-phrases",
    excerpt: "Master self-custody principles. Understand private keys, BIP-39 recovery phrases, and how to defend against phishing and drainers.",
    cover_image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
    category_id: 4,
    author_id: 1,
    status: "published",
    reading_time: 9,
    views: 0,
    shares: 0,
    published_at: "2026-10-25 15:10:00",
    tags: ["Security", "Hardware Wallets", "Self Custody"],
    content: `
# Crypto Wallet Security: The Definitive Guide

The core maxim of the cryptocurrency revolution is **"Not your keys, not your coins."** When you keep digital assets on centralized exchanges, you hold an unsecured IOU. True ownership requires self-custody.

---

## 1. What is a Crypto Wallet Really?
A common misconception is that wallets store cryptocurrencies. In reality:
- Coins and tokens exist exclusively as records on the blockchain ledger.
- Your wallet stores your **private key**—a 256-bit secret number that mathematically proves ownership and signs outgoing transactions.

---

## 2. BIP-39 & Seed Phrases
A 256-bit binary private key looks like this:
\`1101001100101110101010001010101000101...\`

Memorizing or writing down 64 hexadecimal characters is error-prone. The **BIP-39 standard** encodes private keys into 12 or 24 standardized words selected from an immutable dictionary of 2,048 English words.

### Golden Rules of Seed Phrase Custody:
1. **Never type your seed phrase on a digital keyboard** (computers, phones, cloud notes, photos).
2. **Never share it with anyone**; no legitimate customer support agent will ever request your recovery phrase.
3. **Engrave your recovery phrase in fireproof, waterproof steel** to survive physical disasters.

---

## 3. Hardware Wallets vs. Hot Wallets
- **Hot Wallets (Browser Extensions, Mobile Apps):** Convenient for day-to-day trading, but susceptible to malicious browser extensions, memory scrapers, and clipboard-hijacking malware.
- **Hardware Wallets (Secure Element Devices):** Generate and isolate private keys on a specialized cryptographic chip (EAL5+ or EAL6+). Even when connected to an infected computer, transactions are signed internally on the device without ever exposing private key data.

---

## 4. Modern Threats: Smart Contract Drainers
In recent years, the majority of crypto losses have shifted from direct key compromises to **malicious signature requests**:
- **Permit Signatures (EIP-2612):** Gasless token approvals that give hacker contracts permission to transfer your tokens.
- **Eth_sign Blind Signing:** Legacy methods that sign arbitrary payloads capable of authorizing full account draining.

Always verify the recipient address and allowance amounts on your hardware wallet screen before confirming any signature!
    `.trim()
  },
  {
    id: 5,
    title: "How Blockchains Reach Consensus: Proof of Work vs. Proof of Stake",
    slug: "consensus-mechanisms-proof-of-work-vs-proof-of-stake",
    excerpt: "A deep technical comparison between PoW and PoS: Byzantine Fault Tolerance, attack vectors, finality, and energy consumption.",
    cover_image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
    category_id: 1,
    author_id: 1,
    status: "published",
    reading_time: 8,
    views: 0,
    shares: 0,
    published_at: "2026-10-28 11:20:00",
    tags: ["Consensus", "Proof of Stake", "Blockchain"],
    content: `
# Consensus Mechanisms: Proof of Work vs. Proof of Stake

## The Consensus Problem

A blockchain is a shared ledger maintained by a decentralized network of participants. There is no CEO, no central server, no administrator who can dictate what the ledger says. Yet every node must agree on which transactions happened, in what order, and what the current state of the network is. This agreement is called **consensus**, and achieving it without a trusted authority is the central challenge of blockchain design.

The difficulty is not technical storage or networking. It is the presence of **adversaries**. In an open network, anyone can join anonymously, and some participants will be motivated to cheat—to double-spend coins, reverse transactions, or censor rivals. A consensus mechanism must ensure that the honest majority can always prevail, even when a determined minority tries to subvert the system.

Two mechanisms dominate the landscape: **Proof of Work (PoW)**, pioneered by Bitcoin in 2009, and **Proof of Stake (PoS)**, which Ethereum adopted in 2022. They represent fundamentally different philosophies about how to secure a decentralized network.

## Proof of Work: Security Through Computation

Proof of Work was the original breakthrough that made Bitcoin possible. Its logic is elegantly simple: to propose the next block in the chain, a participant (called a **miner**) must solve a computational puzzle.

The puzzle involves repeatedly hashing the block header—which includes the previous block's hash, a set of transactions, and a random number called a **nonce**—until the resulting hash falls below a target threshold. There is no shortcut; the only way to find a valid nonce is brute-force trial and error. The first miner to succeed broadcasts the block to the network, and other nodes verify the solution trivially by running the hash once.

The difficulty of the puzzle adjusts automatically so that blocks are found roughly every ten minutes, regardless of how much computing power joins the network. This self-regulating mechanism keeps block production stable even as the total hash rate grows.

### Why It Works

Proof of Work secures the network by making attacks expensive. To reverse a transaction or double-spend, an attacker must secretly mine a competing chain that is longer than the honest chain—the so-called **51% attack**. This requires controlling a majority of the network's total computational power, which in Bitcoin's case means acquiring physical hardware, electricity, and facilities on an industrial scale. The cost is prohibitive, and the payoff is uncertain because a successful attack would likely crash the value of the very asset the attacker is trying to steal.

The security model is often described as "security through physics." It is anchored in real-world resources: hardware and energy. The longest chain represents the most cumulative work, and nodes follow the longest chain as the canonical history.

### The Trade-offs

Proof of Work's strength is also its weakness. The energy consumption of Bitcoin mining is enormous—comparable to the electricity usage of some small countries. Critics argue this is wasteful, especially as concerns about climate change grow. Defenders counter that the energy expenditure is the precise mechanism that secures the network, and that miners increasingly seek cheap renewable energy sources.

PoW also has a hardware centralization problem. As mining rewards have grown, the industry has consolidated around large mining pools and specialized ASIC hardware, raising concerns that a small number of entities could coordinate to attack the network.

## Proof of Stake: Security Through Economics

Proof of Stake takes a different approach. Instead of burning energy to earn the right to propose blocks, validators **lock up (stake)** a significant amount of the network's native cryptocurrency as collateral. In Ethereum's implementation, a validator must stake 32 ETH to participate.

The network randomly selects validators to propose and attest to blocks, with the probability of selection proportional to the size of the stake. If a validator acts honestly, they earn rewards. If they attempt to cheat—proposing conflicting blocks or validating fraudulent transactions—they can be **slashed**, losing a portion of their staked funds.

### Why It Works

Proof of Stake replaces physical resource expenditure with **crypto-economic incentives**. The security assumption is that validators have more to lose by attacking the network than they could gain. Because a validator's stake is locked and subject to slashing, an attacker seeking to control a majority of the network must acquire a majority of the total staked ETH—an enormously expensive proposition. And if they succeed and attack the network, the value of their own stake would collapse, making the attack self-defeating.

The mechanism also enables **finality**: under PoS, blocks can be explicitly finalized after a certain number of attestations, meaning they cannot be reversed without validators losing their stake. PoW, by contrast, only offers probabilistic finality—the deeper a block is buried, the less likely it is to be reversed, but no block is ever absolutely final.

### The Trade-offs

Proof of Stake dramatically reduces energy consumption—Ethereum's energy usage dropped by over 99.9% after The Merge. It also lowers the barrier to participation, since validators do not need specialized hardware; a modest computer and an internet connection suffice. This can lead to broader decentralization.

But PoS has its own critics. Some argue it inherently favors the wealthy: those with more ETH earn more rewards, potentially concentrating power over time. Others note that PoS relies on complex game theory and slashing conditions that are harder to reason about than the straightforward physical cost of PoW. There is also concern about the role of staking pools and liquid staking protocols, which can concentrate voting power in a few large operators.

## Comparing the Two

| Dimension | Proof of Work | Proof of Stake |
|---|---|---|
| Security basis | Computational cost (energy, hardware) | Economic cost (locked capital) |
| Finality | Probabilistic | Explicit after checkpoint |
| Energy use | Very high | Very low |
| Barrier to entry | High (specialized hardware) | Low (consumer hardware) |
| Attack cost | >51% of hash rate | >51% of staked value |
| Slashing risk | None (miners lose opportunity cost) | Stake can be destroyed |
| Centralization risk | Mining pools, ASIC manufacturers | Staking pools, large holders |

## Conclusion

Neither mechanism is objectively superior. They represent different trade-offs between security, decentralization, and efficiency. Proof of Work is battle-tested over more than fifteen years and secures Bitcoin's trillion-dollar network through sheer physical commitment. Proof of Stake offers a more energy-efficient and accessible alternative, but relies on a more complex set of incentives and has a shorter track record at scale.

The choice between them is not purely technical. It reflects a philosophical stance on what makes a decentralized system trustworthy: the unyielding cost of physical labor, or the credible threat of economic destruction. Both have proven capable of securing billions of dollars in value, and both will likely coexist as the blockchain ecosystem matures.
    `.trim()
  },
  {
    id: 6,
    title: "The Evolution of NFTs: From Digital Art to Real-World Asset Tokenization",
    slug: "evolution-of-nfts-art-to-real-world-assets",
    excerpt: "Trace non-fungible tokens from CryptoPunks and ERC-721 standards to modern tokenized real estate, IP, and sovereign identity.",
    cover_image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    category_id: 2,
    author_id: 1,
    status: "published",
    reading_time: 5,
    views: 0,
    shares: 0,
    published_at: "2026-11-01 14:00:00",
    tags: ["NFTs", "Tokenization", "RWA"],
    content: `
# The Evolution of NFTs: Art to Real-World Assets

When the **ERC-721** standard was finalized on Ethereum in 2018, it introduced a revolutionary primitive: provably unique, verifiable digital property rights.

---

## 1. Fungibility vs. Non-Fungibility
- **Fungible Assets:** Identical in utility and value. One Bitcoin or one \$100 bill is interchangeable with another.
- **Non-Fungible Assets:** Unique identifiers with distinct metadata, ownership history, and attributes (deeds, tickets, art, passports).

---

## 2. Beyond Profile Pictures (PFPs)
While 2021 saw speculative manias around digital avatar collections, the underlying technological utility extends far deeper:

1. **Real-World Asset (RWA) Tokenization:** Real estate deeds, treasury bills, and trade invoices represented as compliant on-chain tokens with transparent title histories.
2. **Dynamic NFTs (ERC-1155 / Oracles):** Tokens whose metadata evolves based on external real-world events (e.g., sports scorecards or weather index insurance).
3. **Decentralized Identity & Verifiable Credentials:** Academic degrees, medical certifications, and credit scores issued directly to user-controlled soulbound addresses.

---

## What Lies Ahead
As legal frameworks mature and institutional liquidity adopts on-chain settlement, non-fungible tokens will become the invisible technological standard powering global title registries and verifiable provenance.
    `.trim()
  }
];
