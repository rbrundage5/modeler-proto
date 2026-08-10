export const VERIFICATION_SUPPORT_STATES=Object.freeze(['complete','partial','import-only','read-only','planned','unsupported']);
export const VERIFICATION_PLAN_STATES=Object.freeze(['no-plan','planned','case-defined','executed-result-recorded','evidence-associated','verified-by-policy','not-verified','indeterminate']);
const concept=(canonicalType,supportState,overrides={})=>Object.freeze({canonicalType,profile:'SysML 1.6 application profile',stableIdentity:'repository-id',ownerRules:'semantic containment',requiredProperties:[],allowedSourceTypes:[],allowedTargetTypes:[],configurationApplicability:'not-supported',importMapping:'none',persistenceSupport:'json-project',operationSupport:'replace-project/set-property',rendererOrTableSupport:'verification-planning-matrix',validationRules:[],auditRules:[],testCoverage:[],supportState,...overrides});
export const VERIFICATION_DOMAIN_INVENTORY=Object.freeze([
 concept('Requirement','complete',{requiredProperties:['requirementId','requirementText'],configurationApplicability:'requirement-applicability-rules',importMapping:'Elements_Import/Requirement',validationRules:['required-id','required-text']}),
 concept('DerivedRequirement','partial',{importMapping:'Requirement stereotype/subtype; no separate metaclass'}),
 concept('TestCase','complete',{requiredProperties:['verificationCaseId','verificationObjective','verificationMethod','acceptanceCriteria','verificationLevel','plannedStatus'],configurationApplicability:'applicabilityRules',importMapping:'Elements_Import/TestCase',validationRules:['case-id','method','owner','configuration']}),
 concept('VerificationMethod','complete',{requiredProperties:['verificationMethod'],rendererOrTableSupport:'controlled property editor'}),
 concept('VerificationObjective','complete',{requiredProperties:['verificationObjective']}),
 concept('ProcedureReference','partial',{requiredProperties:['procedureReference']}),
 concept('VerificationEnvironment','complete',{requiredProperties:['plannedEnvironment']}),
 concept('VerificationLevel','complete',{requiredProperties:['verificationLevel']}),
 concept('VerificationStatus','complete',{requiredProperties:['plannedStatus'],validationRules:['planning-execution-separation']}),
 concept('Verify','complete',{allowedSourceTypes:['TestCase'],allowedTargetTypes:['Requirement'],importMapping:'Relationships_Import/Verify',validationRules:['endpoint-types','direction','duplicate','resolved-endpoints']}),
 concept('Satisfy','read-only',{allowedSourceTypes:['*'],allowedTargetTypes:['Requirement'],validationRules:['not-verification-credit']}),
 concept('Allocate','read-only',{allowedSourceTypes:['*'],allowedTargetTypes:['*'],validationRules:['not-verification-credit']}),
 concept('ApplicableConfiguration','complete',{configurationApplicability:'typed applicability rules'}),
 concept('ConfigurationItem','read-only',{configurationApplicability:'P-03 configuration items'}),
 concept('ResponsibleModelElement','complete',{requiredProperties:['responsibleElementIds']}),
 concept('AcceptanceCriteria','complete',{requiredProperties:['acceptanceCriteria']}),
 concept('ExecutedResult','read-only',{rendererOrTableSupport:'excluded from planning coverage',validationRules:['never-derived-by-P05']}),
 concept('Evidence','read-only',{rendererOrTableSupport:'excluded from planning coverage',validationRules:['never-derived-by-P05']}),
 concept('WaiverOrDeviation','unsupported')
]);
export function verificationStateContract({hasCase=false,hasExecution=false,hasEvidence=false,acceptedPolicy=false,explicitNotVerified=false}={}){if(acceptedPolicy)return'verified-by-policy';if(explicitNotVerified)return'not-verified';if(hasEvidence)return'evidence-associated';if(hasExecution)return'executed-result-recorded';if(hasCase)return'case-defined';return'no-plan'}
