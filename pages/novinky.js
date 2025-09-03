import Layout from "../components/Layout";

export default function Novinky() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-green-700 mb-6">Novinky</h1>

      <div className="space-y-6 text-gray-700">
        {/* 3.9.2025 – nejnovější */}
        <div>
          <h2 className="text-xl font-semibold">3.9.2025 – Spuštění webu a on-line objednávek</h2>
          <p>
            Spustili jsme nové webové stránky a možnost on-line objednávek čerstvých vajec přímo z naší farmy.
          </p>
        </div>

        {/* 23.8.2025 */}
        <div>
          <h2 className="text-xl font-semibold">23.8.2025 – Nový přírůstek do minifarmy</h2>
          <p>
            Přibyli <strong>2 králíci plemene burgundský králík</strong>. V příštím roce tedy bude nově možnost
            objednat si i čerstvé králičí maso. Veškeré informace budou upřesněny později.
          </p>
        </div>

        {/* 16.8.2025 – nejstarší */}
        <div>
          <h2 className="text-xl font-semibold">16.8.2025 – Nové přírůstky</h2>
          <p>
            Do našeho chovu jsme zařadili tři 15ti týdenní slepičky:
            <strong> Dominant BLUESHELL</strong>, <strong>Dominant DARKSHELL</strong> a <strong>Dominant DARKGREEN</strong>.
            Tyto slepičky budou od cca 22. týdne (polovina října) snášet vajíčka se sníženým obsahem cholesterolu
            (barva vajec: modrá, tmavě hnědá, olivově zelená).
          </p>
        </div>
      </div>
    </Layout>
  );
}
