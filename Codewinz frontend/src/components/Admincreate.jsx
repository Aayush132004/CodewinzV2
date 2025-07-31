import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../../utils/axiosClient';
import { useNavigate } from 'react-router';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array','linkedlist','graph','dp','string','stack','queue','tree','bst']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function Admincreate() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'c++', initialCode: '' },
        { language: 'java', initialCode: '' },
        { language: 'javascript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'c++', completeCode: '' },
        { language: 'java', completeCode: '' },
        { language: 'javascript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    try {
      console.log(data);
  
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

return (
  <div className="max-w-5xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold mb-8 text-center">Create New Problem</h1>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      
      {/* ✅ Basic Info */}
      <section className="card bg-base-100 shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6"> Basic Information</h2>
        <div className="space-y-4">

          {/* Title */}
          <div className="form-control">
            <label className="label font-semibold">Title</label>
            <input
              {...register('title')}
              className={`input input-bordered ${errors.title && 'input-error'}`}
              placeholder="Enter problem title"
            />
            {errors.title && <p className="text-error text-sm">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label font-semibold">Description</label>
            <textarea
              {...register('description')}
              className={`textarea textarea-bordered h-28 ${errors.description && 'textarea-error'}`}
              placeholder="Describe the problem"
            />
            {errors.description && <p className="text-error text-sm">{errors.description.message}</p>}
          </div>

          {/* Difficulty & Tag */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control w-full">
              <label className="label font-semibold">Difficulty</label>
              <select {...register('difficulty')} className={`select select-bordered ${errors.difficulty && 'select-error'}`}>
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {errors.difficulty && <p className="text-error text-sm">{errors.difficulty.message}</p>}
            </div>

            <div className="form-control w-full">
              <label className="label font-semibold">Tag</label>
              <select {...register('tags')} className={`select select-bordered ${errors.tags && 'select-error'}`}>
                <option value="">Select a tag</option>
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="tree">Tree</option>
                <option value="string">String</option>
                <option value="dp">Dynamic Programming</option>
                <option value="stack">Dynamic Programming</option>
                <option value="queue">Dynamic Programming</option>
                 <option value="bst">Dynamic Programming</option>
              </select>
              {errors.tags && <p className="text-error text-sm">{errors.tags.message}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Test Cases */}
      <section className="card bg-base-100 shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6"> Test Cases</h2>

        {/* Visible */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Visible Test Cases</h3>
            <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="btn btn-sm btn-outline">
              + Add
            </button>
          </div>

          {visibleFields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 space-y-2 bg-base-200">
              <div className="flex justify-end">
                <button type="button" onClick={() => removeVisible(index)} className="btn btn-xs btn-error">Remove</button>
              </div>

              <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full" />
              <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full" />
              <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="textarea textarea-bordered w-full" />
            </div>
          ))}
        </div>

        {/* Hidden */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Hidden Test Cases</h3>
            <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="btn btn-sm btn-outline">
              + Add
            </button>
          </div>

          {hiddenFields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 space-y-2 bg-base-200">
              <div className="flex justify-end">
                <button type="button" onClick={() => removeHidden(index)} className="btn btn-xs btn-error">Remove</button>
              </div>

              <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full" />
              <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Code Templates */}
      <section className="card bg-base-100 shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6"> Code Templates</h2>

        {[0, 1, 2].map((index) => {
          const language = index === 0 ? "C++" : index === 1 ? "Java" : "JavaScript";

          return (
            <div key={index} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{language}</h3>

              <div className="form-control mb-4">
                <label className="label font-medium">Initial Code</label>
                <textarea
                  {...register(`startCode.${index}.initialCode`)}
                  className="textarea textarea-bordered w-full font-mono"
                  rows={6}
                  placeholder={`Write initial code in ${language}`}
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">Reference Solution</label>
                <textarea
                  {...register(`referenceSolution.${index}.completeCode`)}
                  className="textarea textarea-bordered w-full font-mono"
                  rows={6}
                  placeholder={`Write full solution in ${language}`}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ✅ Submit */}
      <div className="text-center">
        <button type="submit" className="btn btn-primary px-8 text-lg">
          Create Problem
        </button>
      </div>
    </form>
  </div>
);

}

export default Admincreate;