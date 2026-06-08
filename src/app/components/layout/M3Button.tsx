import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

type M3Variant = "filled" | "tonal" | "outlined" | "outlined-danger" | "text";

type M3ButtonBaseProps = {
  variant?: M3Variant;
  children: ReactNode;
  className?: string;
};

type M3ButtonAsButton = M3ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type M3ButtonAsLink = M3ButtonBaseProps & {
  to: string;
  onClick?: () => void;
  "data-testid"?: string;
};

export type M3ButtonProps = M3ButtonAsButton | M3ButtonAsLink;

function variantClass(variant: M3Variant) {
  switch (variant) {
    case "tonal":
      return "m3-btn--tonal";
    case "outlined":
      return "m3-btn--outlined";
    case "outlined-danger":
      return "m3-btn--outlined-danger";
    case "text":
      return "m3-btn--text";
    default:
      return "m3-btn--filled";
  }
}

export default function M3Button(props: M3ButtonProps) {
  const { variant = "filled", children, className = "" } = props;
  const classes = `m3-btn ${variantClass(variant)} ${className}`.trim();

  if ("to" in props && props.to) {
    const { to, onClick, "data-testid": testId } = props;
    return (
      <Link to={to} onClick={onClick} data-testid={testId} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as M3ButtonAsButton;
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
