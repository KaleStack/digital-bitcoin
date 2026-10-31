import React, { useState } from 'react';
import { Send, Cpu, Lock, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export function About() {
  const { success } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success('Thank you! Your message has been sent to our research team.');
      setFormData({ name: '', email: '', message: '' });
    }, 800);
  };

  const team = [
    {
      name: 'Dr. Elena Rostova',
      role: 'Lead Cryptography Researcher',
      bio: 'Specialized in zero-knowledge proofs, elliptic curve pairings, and Byzantine consensus protocols.',
      avatar: 'ER'
    },
    {
      name: 'Marcus Vance',
      role: 'Smart Contract Security Auditor',
      bio: 'EVM security veteran with extensive experience reviewing decentralized finance protocols and AMM invariants.',
      avatar: 'MV'
    },
    {
      name: 'Tariq Al-Mansoor',
      role: 'Consensus Systems Engineer',
      bio: 'Focused on Nakamoto consensus, peer-to-peer gossip networking, and validator architectures.',
      avatar: 'TA'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Mission Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Our Mission</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Uncompromising Technical Depth for the Web3 Era
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          CryptoEdu was established with a singular objective: strip away the speculative hype of the cryptocurrency markets and provide rigorous, accessible, open-source computer science education on decentralized protocols.
        </p>
      </div>

      {/* Core Values Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3 card-hover-effect">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security-First Thinking</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every concept is evaluated from an adversarial standpoint. We emphasize the irreversibility of blockchain transactions and defense-in-depth custody practices.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3 card-hover-effect">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-cyan-950/60 border border-sky-100 dark:border-cyan-800 flex items-center justify-center text-sky-600 dark:text-cyan-400 mb-4 shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">First-Principles Logic</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We don't teach recipes; we teach foundations. From state machines and Merkle Patricia tries to zero-knowledge SNARKs and EVM opcodes.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3 card-hover-effect">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Public Good Education</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Knowledge is a global commons. All curriculum materials, code snippets, and research papers are 100% free, unpaywalled, and open to all.
          </p>
        </div>
      </div>

      {/* Editorial Team */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Researchers & Contributors</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Meet the Academy Leads</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between shadow-xs card-hover-effect">
              <div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-amber-400 p-0.5 mb-4 shadow-xs">
                  <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center font-bold text-sm text-blue-700 dark:text-cyan-300">
                    {member.avatar}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">{member.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md max-w-3xl mx-auto space-y-8 shadow-sm">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Reach Out</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contact the Research Team</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have a curriculum inquiry, discovered an errata, or want to contribute a peer-reviewed guide?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Name"
              required
              placeholder="Vitalik Buterin"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="vitalik@ethereum.org"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Message / Inquiries
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide details about your query or proposed technical contribution..."
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-xs"
            />
          </div>

          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full sm:w-auto gap-2">
            <Send className="w-4 h-4" />
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
