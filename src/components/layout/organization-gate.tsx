'use client';

import { CreateOrganization, OrganizationSwitcher } from '@clerk/nextjs';

export function OrganizationGate() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
        <h1 className="text-2xl font-bold">Choose or create an organization</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          To access the dashboard, you need an active organization.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Select an organization</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Pick an existing organization you belong to.
          </p>
          <div className="mt-4">
            <OrganizationSwitcher hidePersonal />
          </div>
        </div>

        <div className="w-full rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Create a new organization</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Start fresh with a new workspace for your team.
          </p>
          <div className="mt-4">
            <CreateOrganization />
          </div>
        </div>
      </div>
    </div>
  );
}
