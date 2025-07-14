const mongoose=require("mongoose");
const {Schema}=mongoose;

const problemschema=new Schema({
    title:{
        required:true,
        type:String
    },
    description:{
         required:true,
        type:String
    },
    difficulty:{
        type:String,
        required:true,
        enum:['easy','medium','hard'],
    },
    tags:{
        type:String,
        required:true,
        enum:['array','linkedlist','graph','dp'],
    },
    visibleTestCases:[
       { input:{
            type:String,
            require:true,
        },
        output:{
            type:String,
            required:true,
        },
        explanation:{
            type:String,
            required:true,
        }
    }
    ],
    hiddenTestCases:[
       { input:{
            type:String,
            require:true,
        },
        output:{
            type:String,
            required:true,
        },
    }
      ],
    startCode:[
        {
        language:{
            type:String,
            required:true,
        },
        initialCode:{
            type:String,
            required:true,
        }
    }
],
 //reference Solution for so that can give ans to user given testcase or give soln to paid user
 //ie our soln output on user test case and user soln output if match user soln is correct else not
  referenceSolution:[
    {
        language:{
            type:String,
            required:true,
        },
        completeCode:{
            type:String,
            required:true,
        }
    }
  ],
  problemCreator:{
    type:Schema.Types.ObjectId,
    ref:"user",
    required:true
  }
})

const Problem=mongoose.model('problem',problemschema);
module.exports=Problem;