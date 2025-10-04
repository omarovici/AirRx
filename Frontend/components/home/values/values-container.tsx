import { ValueCard } from "./value-card";
import {
  MdGroups,
  MdHealthAndSafety,
  MdNotificationsActive,
} from "react-icons/md";

export function ValuesContainer() {
  const values = [
    {
      Icon: MdGroups,
      title: "People-first",
      copy: "Protecting vulnerable communities through empathetic design.",
    },
    {
      Icon: MdNotificationsActive,
      title: "Real-time alerts",
      copy: "Instant exposure warnings to act quickly and reduce risk.",
    },
    {
      Icon: MdHealthAndSafety,
      title: "Actionable health advice",
      copy: "Clear, practical steps to reduce exposure immediately.",
    },
  ];

  return (
    <section className="grid md:grid-cols-3 gap-4 px-12">
      {values.map((value) => (
        <ValueCard key={value.title} {...value} />
      ))}
    </section>
  );
}
