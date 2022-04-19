/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

/**
 *
 * @author Cristitan
 */
import java.io.File;
import java.io.Serializable;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Map;
import java.util.Map.Entry;
import javassist.CannotCompileException;

import javassist.ClassPool;
import javassist.CtClass;
import javassist.CtField;
import javassist.CtMethod;
import javassist.Modifier;
import javassist.NotFoundException;
import javassist.bytecode.AnnotationsAttribute;
import javassist.bytecode.ClassFile;
import javassist.bytecode.ConstPool;
import javassist.bytecode.annotation.Annotation;
import javassist.bytecode.annotation.IntegerMemberValue;


public class PojoGenerator {

    public String error = "";
    public String props = "";
    public String attributes = "";
    public String classBody = "";
    boolean bReadOnly = false;


    static void removeFinal(CtClass clazz) throws Exception {
        int modifiers = clazz.getModifiers();
        if (Modifier.isFinal(modifiers)) {
            System.out.println("Removing Final");
            int notFinalModifier = Modifier.clear(modifiers, Modifier.FINAL);
            clazz.setModifiers(notFinalModifier);
        }
    }
        
    public Class generate(String className, Map<String, Class<?>> properties, Map<String, Class<?>> attributes) throws Throwable {
        return generate(className, properties, attributes, null);
    }
    
    public Class generate(String className, Map<String, Class<?>> properties, Map<String, Class<?>> attributes, String mode) throws Throwable {
        CtClass cc = null;
        ClassPool pool = null;

        try {

            if(workspace.projectMode) {
                System.out.println("javassist ver.: "+javassist.CtClass.version + " ... generating pojo on '"+className+"' N.props:" + properties.size());
            }

            
            if(mode != null) {
                if(mode.contains("radOnly")) {
                    bReadOnly = true;
                }
                if(mode.contains("nested")) {
                }
            }
            
            try {
                pool = javassist.ClassPool.getDefault();
            } catch(Throwable th) {                
                error += th.getMessage() +" "+ th.getCause();
                System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage()+"..make sure to include javassist.jar in your project, or add fat version of Liquid.jar");
                return null;
            }
            
            try {
	            CtClass ctClass = pool.get(className);
	            if(ctClass != null) {
	            	ctClass.defrost();
	            	removeFinal(ctClass);
	            }
            } catch(Throwable th) {                
            }            
            
            pool.importPackage("java.util");
            pool.importPackage("java.math");
            pool.importPackage("java.sql");
            pool.importPackage("com.liquid");
            pool.importPackage("java.lang.reflect");
            pool.importPackage("java.lang.reflect.Field");

            cc = pool.makeClass(className);

            /*
            // create the annotation
            ClassFile ccFile = cc.getClassFile();
            ConstPool constpool = ccFile.getConstPool();
            AnnotationsAttribute attr = new AnnotationsAttribute(constpool, AnnotationsAttribute.visibleTag);
            Annotation annot = new Annotation("Expose", constpool);
            annot.addMemberValue("value", new IntegerMemberValue(ccFile.getConstPool(), 0));
            attr.addAnnotation(annot);
            */


            error = "";
            props = "";
            classBody = "class "+className+"{\n";
            
            // add this to define a super class to extend
            // cc.setSuperclass(resolveCtClass(MySuperClass.class));
            
            // add this to define an interface to implement            
            cc.addInterface(resolveCtClass(Serializable.class));

            for (Entry<String, Class<?>> entry : properties.entrySet()) {
                
                String propName = entry.getKey();
                Class propClass = entry.getValue();
                // String propClassName = propClass.getName().replaceAll("java.lang.", "");
                String propClassName = propClass.getName();

                // add prop
                CtField newField = new CtField(resolveCtClass(propClass), propName, cc);

                if(propName.indexOf("$Changed") < 0 && propName.indexOf("$Read") < 0) {
                    newField.setAttribute("Expose", "Y".getBytes());
                } else if(propClassName.indexOf("$") > 0 && propClassName.indexOf("@") > 0) {
                    newField.setModifiers(Modifier.VOLATILE);
                } else {
                    newField.setModifiers(Modifier.VOLATILE);
                }

                cc.addField(newField);
                
                props += "["+propName+"]";
                classBody += "\n\t"+"public "+propClassName+" "+propName+";";
            }

            try { cc.addMethod(generateGenericChangeSetter(cc)); } catch(Throwable th) { }
            

            // Attributi
            for (Entry<String, Class<?>> entry : attributes.entrySet()) {
                String attributeName = entry.getKey();
                Class attributeClass = entry.getValue();
                cc.setAttribute(attributeName, "".getBytes());
            }
            
            
            for (Entry<String, Class<?>> entry : properties.entrySet()) {
                String propName = entry.getKey();
                Class propClass = entry.getValue();
                
                if(propName.indexOf("$Changed") < 0 && propName.indexOf("$Read") < 0) {
                    
                    classBody += "\n\t// "+propName;
                    
                    // add getter/setter
                    try {
                    
                        cc.addMethod(generateGetter(cc, propName, propClass));

                    } catch(Throwable th) {
                        System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage()+" on field:'"+propName+"' ..make sure to include javassist.jar in your project");
                        throw th;
                    }
                    
                    // Bug in JAVAASSIST ???
                    // add isChanged getter/setter
                    // try { cc.addMethod(generateGetChanged(cc, propName, propClass)); } catch(Throwable th) { }
                    // try { cc.addMethod(generateSetChanged(cc, propName, propClass)); } catch(Throwable th) { }
                    // try { cc.addMethod(generateSetChangedTrue(cc, propName, propClass)); } catch(Throwable th) { }
                    if(!propClass.equals(Object.class)) {
                        // try { cc.addMethod(generateGenericSetter(cc, propName, propClass)); } catch(Throwable th) { }
                    } else {
                        int lb = 1;
                    }
                }
            }
            
            
            classBody += "\n}";
            
            Class resultClass = cc.toClass();
            
            cc.defrost();
            
            return resultClass;
            
            
        } catch(RuntimeException re) {
            error += "["+re.getMessage()+" " + re.getCause()+"]";
            re.printStackTrace();
            try {
                CtClass c = pool.getCtClass(className);
                if(cc != null)
                    return cc.toClass();
            } catch(Throwable th) {
                th.printStackTrace();
                error += "["+th.getMessage()+" " + th.getCause()+"]";
                System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage()+"..make sure to include javassist.jar in your project");
            }        
            
        } catch(Throwable th) {
            error += th.getMessage() +" "+ th.getCause();
            System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage()+"..make sure to include javassist.jar in your project");
        }        
            
        return null;
    }

    
    private CtMethod generateGetter(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        if("id".equalsIgnoreCase(fieldName)) {
            int lb = 1;
        }
        String getterName = "get" + fieldName.substring(0, 1).toUpperCase()+ fieldName.substring(1);
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        sb.append("public "+className+" "+getterName+"() throws Exception {")
                .append("return this."+fieldName+";}");
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }

    private CtMethod generateSetter(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        sb.append("public void "+setterName+"("+className+" "+fieldName+") throws Exception {")
                .append("this."+fieldName+"="+fieldName+";"+" ")
                .append("this.setChanged(\""+fieldName+"\", true); "+"}")                
                ;
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    
    private CtMethod generateGetChanged(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String getterName = "get" + fieldName.substring(0, 1).toUpperCase()+ fieldName.substring(1)+"$Changed";
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        if(bReadOnly) {
            sb.append("public boolean "+getterName+" throws Exception (){ return false; }");
        } else {
            sb.append("public boolean "+getterName+" throws Exception (){ return this."+fieldName+"$Changed; }");
        }
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    private CtMethod generateSetChanged(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1)+"$Changed";
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        if(bReadOnly) {
            sb.append("public void ").append(setterName).append(" throws Exception (boolean bChanged){ /* read only class */ }");
        } else {
            sb.append("public void ").append(setterName).append(" throws Exception (boolean bChanged){ this."+fieldName+"$Changed=bChanged; }");
        }
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    private CtMethod generateSetChangedTrue(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1)+"$Changed";
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        if(bReadOnly) {
            sb.append("public void ").append(setterName).append(" throws Exception (){ /* read only class */ }");
        } else {
            sb.append("public void ").append(setterName).append(" throws Exception (){ this."+fieldName+"$Changed=true; }");
        }
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    private CtMethod generateGenericChangeSetter(CtClass declaringClass) throws CannotCompileException {
        try {
            String setterName = "setChanged";
            StringBuffer sb = new StringBuffer();
            sb.append("public void "+setterName+"(String fieldName, boolean bChanged) throws Exception {\n")
                .append("\tField field = this.getClass().getDeclaredField(fieldName+\"$Changed\");\n")
                .append("\tif(field!=null) { \n")
                .append("\tfield.setAccessible(true);\n")
                .append("\tfield.set(this,new Boolean(bChanged)); }\n")
                .append("\t}");
            classBody += "\n\t// Generic set propery as changed";
            classBody += "\n\t" + sb.toString();
            return CtMethod.make(sb.toString(), declaringClass);
        } catch(Throwable th) {
            System.err.println("// PojoGenerator.generateGenericChangeSetter() Error:" + th.getLocalizedMessage());
        }
        return null;
    }    
    
    // JAVA MERDA : (javassist.CannotCompileException) javassist.CannotCompileException: 
    //  [source error] invoke(java.lang.Object,java.lang.Object) not found in java.lang.reflect.Method
    //  say : FUCKYOU
    private CtMethod generateGenericSetter(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        try {
            String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            String className = fieldClass.getName().replaceAll("java.lang.", "");
            StringBuffer sb = new StringBuffer();
            sb.append("public void "+setterName+"(Object "+fieldName+") throws Exception  {");
            if(className.equalsIgnoreCase("String")) {
                sb.append("this."+fieldName+"=String.valueOf("+fieldName+"); }");
            } else if(className.equalsIgnoreCase("Boolean")) {
                sb.append("this."+fieldName+"=(Boolean)("+fieldName+"); }");
            } else if(className.equalsIgnoreCase("boolean")) {
                sb.append("this."+fieldName+"=(boolean)("+fieldName+"); }");
            } else if(className.equalsIgnoreCase("Integer")) {
                sb.append("this."+fieldName+"=(Integer)("+fieldName+"); }");
            } else if(className.equalsIgnoreCase("Long")) {
                sb.append("this."+fieldName+"=(Long)("+fieldName+"); }");
            } else if(className.equalsIgnoreCase("Float")) {
                sb.append("this."+fieldName+"=(Float)("+fieldName+"); }");            
            } else if(className.equalsIgnoreCase("Double")) {
                sb.append("this."+fieldName+"=(Double)("+fieldName+"); }");            
            } else if(className.equalsIgnoreCase("Date")) {
                sb.append("try { Class<?> clazz = Class.forName(\"com.liquid.DateUtil\");");
                sb.append("this."+fieldName+"=(Date)clazz.getMethod(\"toDate\", Object.class).invoke("+fieldName+"); } catch (Throwable th) {} }");
            } else if(className.equalsIgnoreCase("java.sql.Timestamp")) {
                sb.append("try { Class<?> clazz = Class.forName(\"com.liquid.DateUtil\");");
                sb.append("this."+fieldName+"=(Timestamp)clazz.getMethod(\"getTimestamp\", Object.class).invoke("+fieldName+"); } catch (Throwable th) {} }");
            } else if(className.equalsIgnoreCase("java.sql.Date")) {
                sb.append("try { Class clazz = Class.forName(\"com.liquid.DateUtil\");");
                sb.append("Class[] cArg = new Class[1];");
                sb.append("cArg[0] = Object.class;");
                sb.append("java.lang.reflect.Method method = clazz.getMethod(\"getDate\", cArg);");
                sb.append("method.setAccessible(true);");
                sb.append("this."+fieldName+"=(java.sql.Date)method.invoke(clazz.newInstance(),"+fieldName+"); } catch (Throwable th) {} }");
            } else if(className.equalsIgnoreCase("java.sql.DateTime")) {
                sb.append("try { Class<?> clazz = Class.forName(\"com.liquid.DateUtil\");");
                sb.append("this."+fieldName+"=(java.sql.DateTime)clazz.getMethod(\"getDateTime\", Object.class).invoke("+fieldName+"); } catch (Throwable th) {} }");
            } else if(className.equalsIgnoreCase("java.math.BigDecimal")) {
                sb.append("try { Class<?> clazz = Class.forName(\"com.liquid.BigDecimaUtil\");");
                sb.append("this."+fieldName+"=(java.math.BigDecimal)clazz.getMethod(\"getBigDecimal\", Object.class).invoke("+fieldName+"); } catch (Throwable th) {} }");
            } else if(className.equalsIgnoreCase("Object")) {
                // th = (javassist.CannotCompileException) javassist.CannotCompileException: [source error] syntax error near " { Class<?> clazz = "
                // sb.append("try { Class<?> clazz = Class.forName(\"com.liquid.utility\");");
                // sb.append("clazz.getMethod(\"set\", Object.class).invoke("+fieldName+"); } catch (Throwable th) {} }");
                sb.append("this."+fieldName+"=(Object)("+fieldName+"); }");
            } else {
                System.err.println(" generateGenericSetter() unrecognized field type:" + fieldClass.getName());
            }
            classBody += "\n\t" + sb.toString();
            return CtMethod.make(sb.toString(), declaringClass);

        } catch(Throwable th) {
            System.err.println("// PojoGenerator.generateGenericSetter() Error:" + th.getLocalizedMessage());
        }
        return null;
    }

    
    
    private static CtMethod generateBaseSetter(CtClass declaringClass) throws CannotCompileException {
        StringBuffer sb = new StringBuffer();
        sb.append("public void get(String prop, Object value) throws Exception {")
                .append("com.liquid.utility.set(this, prop, value);")
                .append("}");
        return CtMethod.make(sb.toString(), declaringClass);
    }

    private static CtMethod generateBaseGetter(CtClass declaringClass) throws CannotCompileException {
        StringBuffer sb = new StringBuffer();
        sb.append("public Object set(String prop) throws Exception {")
          .append("return com.liquid.utility.get(this, prop, value); }");
        return CtMethod.make(sb.toString(), declaringClass);
    }
    
    
    private static CtClass resolveCtClass(Class clazz) throws NotFoundException {
        ClassPool pool = ClassPool.getDefault();
        try {
            return pool.get(clazz.getName());
        } catch (Exception e) {
            e.printStackTrace();
            if(clazz.getName().equalsIgnoreCase("java.sql.Timestamp")) {
            } else {
            }
        }
        return null;
    }
}

