import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Permile",
  description:
    "Politique de confidentialité de Permile et de son extension navigateur Connecteur LLM.",
};

export default function PrivacyPage() {
  return (
    <main className="shell page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1>Politique de confidentialité</h1>
          <p className="sub">
            Permile et l&apos;extension « Permile — Connecteur LLM ».
            Dernière mise à jour : juillet 2026.
          </p>
        </div>
      </div>

      <section className="section">
        <h2>Ce que nous collectons</h2>
        <p className="muted">
          L&apos;extension et le site collectent le strict minimum pour
          fonctionner : un <strong>identifiant pseudonyme</strong> généré
          aléatoirement (ex. <code>usr_ext_abc123</code>), les{" "}
          <strong>événements publicitaires</strong> associés (pub affichée,
          clic, achat déclaré) et les <strong>centres d&apos;intérêt</strong>{" "}
          que vous choisissez. Aucune donnée nominative n&apos;est requise :
          pas de nom, pas d&apos;e-mail, pas de compte.
        </p>
      </section>

      <section className="section">
        <h2>Ce que nous ne collectons pas</h2>
        <p className="muted">
          L&apos;extension ne lit, n&apos;enregistre ni ne transmet{" "}
          <strong>jamais</strong> le contenu de vos conversations avec les
          assistants IA (prompts, réponses), votre historique de navigation,
          ou toute donnée présente sur les pages visitées. Elle se contente de
          détecter localement qu&apos;une génération est en cours pour
          afficher une publicité.
        </p>
      </section>

      <section className="section">
        <h2>Où vont les données</h2>
        <p className="muted">
          Les événements publicitaires sont envoyés à l&apos;API Permile
          uniquement, associés à votre identifiant pseudonyme, afin de
          créditer vos gains et de mesurer les campagnes des annonceurs
          (impressions, clics agrégés). Elles ne sont ni vendues ni partagées
          avec des tiers. L&apos;identifiant est stocké localement dans votre
          navigateur (stockage de l&apos;extension ou localStorage).
        </p>
      </section>

      <section className="section">
        <h2>Extension Chrome « Permile — Connecteur LLM »</h2>
        <p className="muted">
          L&apos;extension a une <strong>finalité unique</strong> : afficher
          une publicité sponsorisée pendant que les assistants IA génèrent
          leurs réponses, et créditer les gains correspondants sur le
          portefeuille Permile de l&apos;utilisateur. La seule catégorie de
          données collectée est l&apos;<strong>activité de
          l&apos;utilisateur</strong> relative aux publicités Permile
          (affichage d&apos;une publicité, clic sur une publicité), associée à
          un identifiant pseudonyme. L&apos;autorisation <code>storage</code>{" "}
          sert uniquement à mémoriser cet identifiant ;
          l&apos;accès réseau sert uniquement à récupérer les publicités et à
          enregistrer ces événements auprès de l&apos;API Permile.
        </p>
        <p className="muted">
          Conformément aux exigences « Limited Use » du Chrome Web Store :
          nous ne vendons ni ne transférons les données des utilisateurs à
          des tiers en dehors des cas d&apos;utilisation approuvés ; nous ne
          les utilisons ni ne les transférons à des fins sans rapport avec la
          finalité unique de l&apos;extension ; nous ne les utilisons jamais
          pour évaluer la solvabilité ou à des fins de prêt. Les annonceurs
          ne reçoivent que des statistiques agrégées de campagne
          (impressions, clics, conversions) — jamais de données individuelles.
        </p>
      </section>

      <section className="section">
        <h2>Vos droits</h2>
        <p className="muted">
          Vous pouvez supprimer votre identifiant et vos données locales à
          tout moment (désinstallation de l&apos;extension ou effacement des
          données du site), et demander la suppression du portefeuille associé
          à votre identifiant en nous contactant.
        </p>
      </section>

      <section className="section">
        <h2>Contact</h2>
        <p className="muted">
          Pour toute question relative à cette politique :{" "}
          <a href="mailto:contact@myfrank.io" style={{ color: "var(--accent)" }}>
            contact@myfrank.io
          </a>
          .
        </p>
      </section>
    </main>
  );
}
