// Secret Ads — popup : affiche le solde du portefeuille et permet de lier
// l'extension à l'identifiant visible sur la page « Gagner de l'argent ».

// ⚙️ Adaptez si votre déploiement est sur un autre domaine
var API = "https://secret-ads-real.vercel.app";

var eur = function (v) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
};

function refresh(uid) {
  document.getElementById("uid").value = uid;
  fetch(API + "/api/wallet?uid=" + encodeURIComponent(uid))
    .then(function (r) {
      return r.json();
    })
    .then(function (json) {
      if (!json || !json.wallet) return;
      document.getElementById("balance").textContent = eur(json.wallet.balance);
      document.getElementById("views").textContent = String(json.wallet.views);
      document.getElementById("clicks").textContent = String(
        json.wallet.clicks
      );
    })
    .catch(function () {
      document.getElementById("balance").textContent = "hors ligne";
    });
}

chrome.storage.sync.get("uid", function (data) {
  var uid = data.uid || "";
  if (uid) refresh(uid);
});

document.getElementById("save").addEventListener("click", function () {
  var v = document.getElementById("uid").value.trim();
  if (!/^[\w-]{1,64}$/.test(v)) {
    document.getElementById("msg").textContent = "Identifiant invalide.";
    return;
  }
  chrome.storage.sync.set({ uid: v }, function () {
    document.getElementById("msg").textContent = "Enregistré ✓";
    refresh(v);
  });
});
