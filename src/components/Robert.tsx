export default function Robert({
  expression = "happy",
  className = "",
}: {
  expression?: "happy" | "thinking" | "celebrating";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 260"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="124" cy="240" rx="77" ry="10" fill="#1F2A44" opacity=".08" />
      <path
        d="M55 171C21 164 22 141 37 144L65 155M184 164C221 150 226 128 210 131L177 151"
        stroke="#2454C5"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="M84 213L78 237M161 213L170 237"
        stroke="#2454C5"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <rect x="63" y="126" width="118" height="99" rx="36" fill="#2F6BFF" />
      <rect x="83" y="150" width="77" height="43" rx="15" fill="#E5F0FF" />
      <path d="M111 161L134 173L111 185Z" fill="#2F6BFF" />
      <path
        d="M121 27V12"
        stroke="#1F2A44"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="121" cy="10" r="9" fill="#FFC83D" />
      <rect x="24" y="61" width="22" height="45" rx="11" fill="#E9AA20" />
      <rect x="196" y="61" width="22" height="45" rx="11" fill="#E9AA20" />
      <rect x="36" y="27" width="170" height="119" rx="42" fill="#FFC83D" />
      <rect x="51" y="43" width="140" height="83" rx="29" fill="#FFF9E8" />
      <path
        d="M57 62C68 49 82 48 94 48"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {expression === "celebrating" ? (
        <>
          <path
            d="M76 83L86 73L96 83M147 83L157 73L167 83"
            stroke="#1F2A44"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M104 96Q121 123 138 96Z" fill="#1F2A44" />
        </>
      ) : (
        <>
          <ellipse cx="85" cy="81" rx="8" ry="12" fill="#1F2A44" />
          <ellipse cx="156" cy="81" rx="8" ry="12" fill="#1F2A44" />
          {expression === "thinking" ? (
            <path
              d="M111 107H131"
              stroke="#1F2A44"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M106 99Q121 115 136 99"
              stroke="#1F2A44"
              strokeWidth="6"
              strokeLinecap="round"
            />
          )}
        </>
      )}
      <ellipse cx="68" cy="101" rx="11" ry="6" fill="#FF9888" opacity=".6" />
      <ellipse cx="173" cy="101" rx="11" ry="6" fill="#FF9888" opacity=".6" />
      <circle cx="173" cy="137" r="8" fill="#3DDC97" />
      <path
        d="M48 216L34 225M205 206L219 213"
        stroke="#FFC83D"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
