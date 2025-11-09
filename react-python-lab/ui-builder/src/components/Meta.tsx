import { useEffect } from "react";
import { useAppContext } from "../hooks/common";

interface TitleProps {
  value: string;
}

export const Title = ({ value }: TitleProps) => {
  const ctx = useAppContext();

  useEffect(() => {
    ctx?.setTitle(value);
  }, []);

  return <></>;
};
