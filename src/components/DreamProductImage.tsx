import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CatalogProduct } from "../domain/catalog";
export default function DreamProductImage({
  product,
}: {
  product?: CatalogProduct;
}) {
  const [failed, setFailed] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="dream-illustration">
      {product && !failed ? (
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="dream-image-empty">
          <PackageSearch size={48} />
          <p>{t(product ? "productImageUnavailable" : "chooseDreamProduct")}</p>
        </div>
      )}
    </div>
  );
}
