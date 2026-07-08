'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  createPostingAction,
  updatePostingAction,
  setPostingStatusAction,
  type PostingActionState,
} from '@/actions/admin-careers.actions';
import s from './careers.module.css';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

type Posting = {
  id: string
  title: string
  department: string | null
  location: string | null
  employmentType: string | null
  description: string
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

type PostingFormProps =
  | { mode: 'new' }
  | { mode: 'edit'; posting: Posting };

export function PostingForm(props: PostingFormProps) {
  const { mode } = props;
  const posting = mode === 'edit' ? props.posting : null;
  const router = useRouter();
  const action = mode === 'new'
    ? createPostingAction
    : updatePostingAction.bind(null, posting!.id);
  const [state, formAction] = useActionState<PostingActionState, FormData>(action, null);

  async function handleClose() {
    if (!posting) return;
    await setPostingStatusAction(posting.id, 'closed');
    router.push('/admin/careers');
  }

  return (
    <div className={s.formPage}>
      <button type="button" className={s.backLink} onClick={() => router.push('/admin/careers')}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Back to postings
      </button>
      <h1 className={s.title}>{mode === 'edit' ? 'Edit posting' : 'New posting'}</h1>

      <form action={formAction} className={s.form}>
        {state && 'error' in state && (
          <p className="field-error" role="alert">{state.error}</p>
        )}

        <div className="field">
          <label className="field-label" htmlFor="title">Title</label>
          <input
            className="input"
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Founding full-stack engineer"
            defaultValue={posting?.title ?? ''}
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className={s.formRow}>
          <div className="field">
            <label className="field-label" htmlFor="department">Department</label>
            <input
              className="input"
              id="department"
              name="department"
              type="text"
              placeholder="e.g. Engineering"
              defaultValue={posting?.department ?? ''}
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="location">Location</label>
            <input
              className="input"
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Remote"
              defaultValue={posting?.location ?? ''}
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="employmentType">Employment type</label>
          <div className={`input-adorn-wrap ${s.selectWrap}`}>
            <select
              className="input"
              id="employmentType"
              name="employmentType"
              defaultValue={posting?.employmentType ?? EMPLOYMENT_TYPES[0]}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <i className="ti ti-chevron-down" aria-hidden="true" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="description">Description</label>
          <textarea
            className="input"
            id="description"
            name="description"
            style={{ minHeight: '200px' }}
            placeholder="Describe the role, responsibilities, and what you're looking for. Markdown supported."
            defaultValue={posting?.description ?? ''}
          />
          <span className="field-hint">This is shown on the public posting detail page.</span>
        </div>

        <div className={s.formActions}>
          <SubmitButton
            label={mode === 'edit' ? 'Save changes' : 'Publish posting'}
            pendingLabel={mode === 'edit' ? 'Saving…' : 'Publishing…'}
          />
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin/careers')}>
            Cancel
          </button>
          {mode === 'edit' && (
            <button type="button" className={`btn btn-ghost ${s.dangerAction}`} onClick={handleClose}>
              <i className="ti ti-archive" aria-hidden="true" />
              Close role
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
