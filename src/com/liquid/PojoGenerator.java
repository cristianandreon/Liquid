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


public class PojoGenerator {

    public String error = "";
    public String props = "";
    public String attributes = "";
    public String classBody = "";
    
    
	static void removeFinal(CtClass clazz) throws Exception {
        int modifiers = clazz.getModifiers();
        if(Modifier.isFinal(modifiers)) {
            System.out.println("Removing Final");
            int notFinalModifier = Modifier.clear(modifiers, Modifier.FINAL);
            clazz.setModifiers(notFinalModifier);
        }
    }
        
        
    public Class generate(String className, Map<String, Class<?>> properties, Map<String, Class<?>> attributes) throws Throwable {
        CtClass cc = null;
        ClassPool pool = null;
        
        try {

            System.out.println("javassist ver.: "+javassist.CtClass.version);

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
            
            cc = pool.makeClass(className);

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
                cc.addField(new CtField(resolveCtClass(propClass), propName, cc));
                
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
                    cc.addMethod(generateGetter(cc, propName, propClass));
                    cc.addMethod(generateSetter(cc, propName, propClass));
                    
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
        sb.append("public boolean "+getterName+" throws Exception (){ return this."+fieldName+"$Changed; }");
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    private CtMethod generateSetChanged(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1)+"$Changed";
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        sb.append("public void ").append(setterName).append(" throws Exception (boolean bChanged){ this."+fieldName+"$Changed=bChanged; }");
        classBody += "\n\t" + sb.toString();
        return CtMethod.make(sb.toString(), declaringClass);
    }
    private CtMethod generateSetChangedTrue(CtClass declaringClass, String fieldName, Class fieldClass) throws CannotCompileException {
        String setterName = "set" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1)+"$Changed";
        String className = fieldClass.getName().replaceAll("java.lang.", "");
        StringBuffer sb = new StringBuffer();
        sb.append("public void ").append(setterName).append(" throws Exception (){ this."+fieldName+"$Changed=true; }");
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
                .append("\tfield.set(this,new Boolean(bChanged)); };\n")
                .append("\t}");
            classBody += "\n\t// Generic set propery as changed";
            classBody += "\n\t" + sb.toString();
            return CtMethod.make(sb.toString(), declaringClass);
        } catch(Throwable th) {
            System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage());
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
            System.err.println("// PojoGenerator.generate() Error:" + th.getLocalizedMessage());
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
        return pool.get(clazz.getName());
    }
}

/*
class LiquidX_liquidx_users{

	public java.sql.Date date;
	public boolean emailValidated$Changed;
	public String emailToken;
	public boolean id$Changed;
	public String cognome;
	public boolean password$Changed;
	public Integer naccess;
	public Integer admin;
	public boolean status$Changed;
	public boolean emailToken$Changed;
	public String domain_id;
	public boolean nfails$Changed;
	public String password;
	public boolean naccess$Changed;
	public Integer id;
	public boolean application_id$Changed;
	public boolean expire$Changed;
	public String email;
	public Object $Parent;
	public boolean date$Changed;
	public boolean admin$Changed;
	public boolean token$Changed;
	public boolean email$Changed;
	public Integer nfails;
	public boolean cognome$Changed;
	public String nome;
	public String application_id;
	public boolean domain_id$Changed;
	public String token;
	public boolean $Parent$Read;
	public boolean user$Changed;
	public String expire;
	public boolean nome$Changed;
	public boolean $Parent$Changed;
	public String user;
	public Integer emailValidated;
	public String status;
	// Generic set propery as changed
	public void setChanged(String fieldName, boolean bChanged) throws Exception {
	Field field = this.getClass().getDeclaredField(fieldName+"$Changed");
	if(field!=null) { 
	field.setAccessible(true);
	field.set(this,new Boolean(bChanged)); };
        }
	// date
	public java.sql.Date getDate() throws Exception {return this.date;}
	public void setDate(java.sql.Date date) throws Exception {this.date=date; this.setChanged("date", true); }
	public void setDate(Object date) throws Exception  {try { Class clazz = Class.forName("com.liquid.DateUtil");Class[] cArg = new Class[1];cArg[0] = Object.class;java.lang.reflect.Method method = clazz.getMethod("getDate", cArg);method.setAccessible(true);this.date=(java.sql.Date)method.invoke(clazz.newInstance(),date); } catch (Throwable th) {} }
	// emailToken
	public String getEmailToken() throws Exception {return this.emailToken;}
	public void setEmailToken(String emailToken) throws Exception {this.emailToken=emailToken; this.setChanged("emailToken", true); }
	public void setEmailToken(Object emailToken) throws Exception  {this.emailToken=String.valueOf(emailToken); }
	// cognome
	public String getCognome() throws Exception {return this.cognome;}
	public void setCognome(String cognome) throws Exception {this.cognome=cognome; this.setChanged("cognome", true); }
	public void setCognome(Object cognome) throws Exception  {this.cognome=String.valueOf(cognome); }
	// naccess
	public Integer getNaccess() throws Exception {return this.naccess;}
	public void setNaccess(Integer naccess) throws Exception {this.naccess=naccess; this.setChanged("naccess", true); }
	public void setNaccess(Object naccess) throws Exception  {this.naccess=(Integer)(naccess); }
	// admin
	public Integer getAdmin() throws Exception {return this.admin;}
	public void setAdmin(Integer admin) throws Exception {this.admin=admin; this.setChanged("admin", true); }
	public void setAdmin(Object admin) throws Exception  {this.admin=(Integer)(admin); }
	// domain_id
	public String getDomain_id() throws Exception {return this.domain_id;}
	public void setDomain_id(String domain_id) throws Exception {this.domain_id=domain_id; this.setChanged("domain_id", true); }
	public void setDomain_id(Object domain_id) throws Exception  {this.domain_id=String.valueOf(domain_id); }
	// password
	public String getPassword() throws Exception {return this.password;}
	public void setPassword(String password) throws Exception {this.password=password; this.setChanged("password", true); }
	public void setPassword(Object password) throws Exception  {this.password=String.valueOf(password); }
	// id
	public Integer getId() throws Exception {return this.id;}
	public void setId(Integer id) throws Exception {this.id=id; this.setChanged("id", true); }
	public void setId(Object id) throws Exception  {this.id=(Integer)(id); }
	// email
	public String getEmail() throws Exception {return this.email;}
	public void setEmail(String email) throws Exception {this.email=email; this.setChanged("email", true); }
	public void setEmail(Object email) throws Exception  {this.email=String.valueOf(email); }
	// $Parent
	public Object get$Parent() throws Exception {return this.$Parent;}
	public void set$Parent(Object $Parent) throws Exception {this.$Parent=$Parent; this.setChanged("$Parent", true); }
	// nfails
	public Integer getNfails() throws Exception {return this.nfails;}
	public void setNfails(Integer nfails) throws Exception {this.nfails=nfails; this.setChanged("nfails", true); }
	public void setNfails(Object nfails) throws Exception  {this.nfails=(Integer)(nfails); }
	// nome
	public String getNome() throws Exception {return this.nome;}
	public void setNome(String nome) throws Exception {this.nome=nome; this.setChanged("nome", true); }
	public void setNome(Object nome) throws Exception  {this.nome=String.valueOf(nome); }
	// application_id
	public String getApplication_id() throws Exception {return this.application_id;}
	public void setApplication_id(String application_id) throws Exception {this.application_id=application_id; this.setChanged("application_id", true); }
	public void setApplication_id(Object application_id) throws Exception  {this.application_id=String.valueOf(application_id); }
	// token
	public String getToken() throws Exception {return this.token;}
	public void setToken(String token) throws Exception {this.token=token; this.setChanged("token", true); }
	public void setToken(Object token) throws Exception  {this.token=String.valueOf(token); }
	// expire
	public String getExpire() throws Exception {return this.expire;}
	public void setExpire(String expire) throws Exception {this.expire=expire; this.setChanged("expire", true); }
	public void setExpire(Object expire) throws Exception  {this.expire=String.valueOf(expire); }
	// user
	public String getUser() throws Exception {return this.user;}
	public void setUser(String user) throws Exception {this.user=user; this.setChanged("user", true); }
	public void setUser(Object user) throws Exception  {this.user=String.valueOf(user); }
	// emailValidated
	public Integer getEmailValidated() throws Exception {return this.emailValidated;}
	public void setEmailValidated(Integer emailValidated) throws Exception {this.emailValidated=emailValidated; this.setChanged("emailValidated", true); }
	public void setEmailValidated(Object emailValidated) throws Exception  {this.emailValidated=(Integer)(emailValidated); }
	// status
	public String getStatus() throws Exception {return this.status;}
	public void setStatus(String status) throws Exception {this.status=status; this.setChanged("status", true); }
	public void setStatus(Object status) throws Exception  {this.status=String.valueOf(status); }
}


*/