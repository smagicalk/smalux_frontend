import { ShieldCheckIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  billingCycleOptions,
  initialServerCreateFormValues,
  priceCurrencyOptions,
  trafficModeOptions,
  trafficUnitOptions,
  validateServerCreateForm,
  type ServerBillingCycle,
  type ServerCreateFormValues,
  type ServerPriceCurrency,
  type ServerTrafficMode,
  type ServerTrafficUnit
} from "@/features/nodes/model/server-create-form";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { Field, Select, TextInput } from "@/shared/ui/form-controls";

type AddServerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ServerCreateFormValues) => void;
};

type ServerCreateFormUpdate = <Key extends keyof ServerCreateFormValues>(
  key: Key,
  value: ServerCreateFormValues[Key]
) => void;

export function AddServerDialog({ open, onOpenChange, onSubmit }: AddServerDialogProps) {
  const [values, setValues] = useState<ServerCreateFormValues>(initialServerCreateFormValues);
  const [errors, setErrors] = useState<string[]>([]);

  const updateValue: ServerCreateFormUpdate = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setValues(initialServerCreateFormValues);
    setErrors([]);
  };

  const submitForm = () => {
    const nextErrors = validateServerCreateForm(values);
    setErrors(nextErrors);

    if (nextErrors.length > 0) {
      return;
    }

    onSubmit(values);
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-xl rounded-md shadow-none" closeClassName="right-3 top-3">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border/70 p-3 pr-14">
            <DialogTitle className="text-lg">添加服务器</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid gap-3 p-3">
            <ServerCreateErrors errors={errors} />

            <ServerIdentitySection values={values} onUpdate={updateValue} />
            <ServerBillingSection values={values} onUpdate={updateValue} />
            <ServerTrafficSection values={values} onUpdate={updateValue} />
          </DialogBody>
          <DialogFooter className="border-t border-border/70 p-3">
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button type="submit">添加服务器</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function ServerCreateErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-md border border-danger/25 bg-[color:var(--surface-danger)] p-3 text-sm text-danger">
      <div className="flex items-center gap-2 font-semibold">
        <ShieldCheckIcon aria-hidden className="shrink-0" />
        表单需要补充
      </div>
      <ul className="grid gap-1">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

function ServerIdentitySection({
  values,
  onUpdate
}: {
  values: ServerCreateFormValues;
  onUpdate: ServerCreateFormUpdate;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-semibold">基础信息</legend>
      <div className="grid gap-2">
        <Field label="服务器名称">
          <TextInput
            className="h-9 rounded-md"
            placeholder="tyo-core-02"
            value={values.name}
            onChange={(event) => onUpdate("name", event.target.value)}
          />
        </Field>
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_190px]">
          <Field label="价格">
            <TextInput
              className="h-9 rounded-md"
              inputMode="decimal"
              placeholder="0"
              value={values.price}
              onChange={(event) => onUpdate("price", event.target.value)}
            />
          </Field>
          <Field label="货币">
            <Select
              className="h-9 rounded-md"
              value={values.priceCurrency}
              onChange={(event) => onUpdate("priceCurrency", event.target.value as ServerPriceCurrency)}
            >
              {priceCurrencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </fieldset>
  );
}

function ServerBillingSection({
  values,
  onUpdate
}: {
  values: ServerCreateFormValues;
  onUpdate: ServerCreateFormUpdate;
}) {
  return (
    <fieldset className="grid gap-2 border-t border-border/70 pt-3">
      <legend className="mb-1 text-sm font-semibold">计费与到期</legend>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="计费周期">
          <Select
            className="h-9 rounded-md"
            value={values.billingCycle}
            onChange={(event) => onUpdate("billingCycle", event.target.value as ServerBillingCycle)}
          >
            {billingCycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="到期时间">
          <TextInput
            className="h-9 rounded-md"
            type="date"
            disabled={values.neverExpires}
            value={values.expiresAt}
            onChange={(event) => onUpdate("expiresAt", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="flex min-h-9 items-center gap-3 rounded-md border border-input bg-white/55 px-3 text-sm dark:bg-white/6">
          <input
            type="checkbox"
            checked={values.neverExpires}
            onChange={(event) => onUpdate("neverExpires", event.target.checked)}
          />
          永久有效
        </label>
        <label className="flex min-h-9 items-center gap-3 rounded-md border border-input bg-white/55 px-3 text-sm dark:bg-white/6">
          <input
            type="checkbox"
            checked={values.autoRenew}
            onChange={(event) => onUpdate("autoRenew", event.target.checked)}
          />
          自动延续
        </label>
      </div>
    </fieldset>
  );
}

function ServerTrafficSection({
  values,
  onUpdate
}: {
  values: ServerCreateFormValues;
  onUpdate: ServerCreateFormUpdate;
}) {
  return (
    <fieldset className="grid gap-2 border-t border-border/70 pt-3">
      <legend className="mb-1 text-sm font-semibold">流量规则</legend>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="流量计算">
          <Select
            className="h-9 rounded-md"
            value={values.trafficMode}
            onChange={(event) => onUpdate("trafficMode", event.target.value as ServerTrafficMode)}
          >
            {trafficModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="额度">
          <TextInput
            className="h-9 rounded-md"
            inputMode="decimal"
            placeholder="0"
            value={values.trafficAmount}
            onChange={(event) => onUpdate("trafficAmount", event.target.value)}
          />
        </Field>
        <Field label="单位" className="md:max-w-40">
          <Select
            className="h-9 rounded-md"
            value={values.trafficUnit}
            onChange={(event) => onUpdate("trafficUnit", event.target.value as ServerTrafficUnit)}
          >
            {trafficUnitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </fieldset>
  );
}
