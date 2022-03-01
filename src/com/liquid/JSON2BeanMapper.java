package com.liquid;

import java.util.ArrayList;

public class JSON2BeanMapper {

    String jsonProp, beanProp;
    Class cls;
    String format;
    String exception;

    public JSON2BeanMapper(String jsonProp, String beanProp, Class cls, String format, String exception) {
        this.jsonProp = jsonProp;
        this.beanProp = beanProp;
        this.cls = cls;
        this.format = format;
        this.exception = exception;
    }

    public JSON2BeanMapper(String jsonProp, String beanProp) {
        this.jsonProp = jsonProp;
        this.beanProp = beanProp;
    }

    static public JSON2BeanMapper findMapper(ArrayList<JSON2BeanMapper> json2BeanMapper, String jsonProp) {
        for (int i = 0; i < json2BeanMapper.size(); i++) {
            if(json2BeanMapper.get(i).jsonProp.equalsIgnoreCase(jsonProp)) {
                return json2BeanMapper.get(i);
            }
        }
        return null;
    }

    static public String findBeanProp(ArrayList<JSON2BeanMapper> json2BeanMapper, String jsonProp) {
        for (int i = 0; i < json2BeanMapper.size(); i++) {
            if(json2BeanMapper.get(i).jsonProp.equalsIgnoreCase(jsonProp)) {
                return json2BeanMapper.get(i).beanProp;
            }
        }
        return jsonProp;
    }
}
